import urlModel from "../models/urlModel.js";
import Counter from "../models/counterModel.js";
import useragent from "useragent";
import redisClient from '../configs/redis.js';

const DOMAIN = process.env.BASE_URL || "http://localhost:3000";
const BASE62_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

const encodeBase62 = (num) => {
  if (num === 0) return BASE62_ALPHABET[0];
  let encodedString = "";
  while (num > 0) {
    encodedString = BASE62_ALPHABET[num % 62] + encodedString;
    num = Math.floor(num / 62);
  }
  return encodedString;
};



const getNextSequenceValue = async (sequenceName) => {
    // This finds the counter, adds 1 to it, and returns the new number atomically
    const sequenceDocument = await Counter.findByIdAndUpdate(
        sequenceName,
        { $inc: { seq: 1 } },
        { new: true, upsert: true } // upsert creates the counter if it doesn't exist yet
    );
    return sequenceDocument.seq;
};

const createShortUrl = async (req, res) => {
  try {
    const { originalUrl } = req.body;
    const userId = req.session?.user?.id || req.ip; // Fallback to IP if not logged in

    //  LAYER 1: REDIS IDEMPOTENCY LOCK (The Network Bouncer)
    // Create a unique signature for this specific request.
    const idempotencyKey = `lock:create_url:${userId}:${originalUrl}`;
    
    // Check if this user is already trying to shorten this exact URL right now
    const isLocked = await redisClient.get(idempotencyKey);
    if (isLocked) {
        return res.status(429).json({ 
            message: "System cooling down. Duplicate request blocked." 
        });
    }

    // Lock the request in Redis for 5 seconds. 
    // If your brother clicks 10 times in 5 seconds, 9 of them hit the wall above.
    await redisClient.setEx(idempotencyKey, 5, "LOCKED");

    //  LAYER 2: MONGODB DEDUPLICATION (The Long-Term Memory)
    if (req.session?.user?.id) {
        const existingUrl = await urlModel.findOne({ 
            originalUrl: originalUrl, 
            createdBy: req.session.user.id,
            isDeleted: false 
        });

        if (existingUrl) {
            // Remove the Redis lock early since we are done
            await redisClient.del(idempotencyKey);
            
            return res.status(200).json({
                shortUrl: `${DOMAIN}/api/url/${existingUrl.shortCode}`,
                shortCode: existingUrl.shortCode,
                _id: existingUrl._id,
                message: "Retrieved existing link"
            });
        }
    }
    // 1. Get a mathematically guaranteed unique integer
    const uniqueId = await getNextSequenceValue('urlId');

    // 2. Convert that integer to a Base62 Short Code
    const shortCode = encodeBase62(uniqueId);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // 3. Save to MongoDB
    const url = await urlModel.create({
      originalUrl,
      shortCode,
      createdBy: req.session?.user?.id,
      expiresAt
    });

    // 4. Proactive Caching: Save to Redis instantly
    await redisClient.setEx(`url:${shortCode}`, 86400, originalUrl);

    return res.status(201).json({
      shortUrl: `${DOMAIN}/api/url/${shortCode}`,
      shortCode,
      _id: url._id //  Returning _id so the frontend delete button works
    });

  } catch (err) {
    console.error("Base62 Generator Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const redirectUrl = async (req, res) => {
  try {
    const { shortCode } = req.params;
    const ip = req.ip;

    // Parse incoming analytics data
    const agent = useragent.parse(req.headers["user-agent"]);
    const device = agent.toAgent();
    const country = req.headers["cf-ipcountry"] || "Unknown";
    const cacheKey = `url:${shortCode}`;

    // Define the heavy database update payload ONCE
    const analyticsUpdate = {
      $inc: { clicks: 1 },
      $set: { lastAccessed: new Date() },
      $push: {
        analytics: {
          ip,
          country,
          device,
          timestamp: new Date()
        }
      }
    };

    // 1. THE CACHE HIT (Lightning Fast Redirect)
    const cachedUrl = await redisClient.get(cacheKey);

    if (cachedUrl) {
      // FIRE AND FORGET: We do NOT use 'await' here. 
      // We send the user to their destination instantly, while MongoDB does the heavy lifting in the background.
      urlModel.findOneAndUpdate({ shortCode, isDeleted: false }, analyticsUpdate).exec();
      
      return res.redirect(cachedUrl);
    }

    //  2. THE CACHE MISS (Database Query)
    // We update the analytics AND get the document back in one trip to the database
    const url = await urlModel.findOneAndUpdate(
      { shortCode, isDeleted: false },
      analyticsUpdate,
      { new: true } 
    );

    if (!url) {
      // Use your custom error page or standard JSON
      return res.status(404).json({ message: "System Reject: URL not found or terminated." });
    }

    //  3. REPOPULATE CACHE
    // Save it in Redis for 24 hours (86400 seconds) so the next click is instant
    await redisClient.setEx(cacheKey, 86400, url.originalUrl);

    // Finally, redirect the user
    return res.redirect(url.originalUrl);

  } catch (err) {
    console.error("Redirect Error:", err);
    res.status(500).json({ message: "Network malfunction." });
  }
};

const getUserUrls = async (req, res) => {
  try {
    const urls = await urlModel.find({
      createdBy: req.session?.user?.id,
      isDeleted: false
    });
    res.json(urls);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

const getUrlAnalytics = async (req, res) => {
  try {
    const shortCode = req.params.id;
    const url = await urlModel.findOne({ shortCode: shortCode, isDeleted: false });

    if (!url) {
      return res.status(404).send("URL not found");
    }
    
    // 1. Setup Last 7 Days Array
    const last7Days = [];
    const clicksPerDay = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7Days.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      clicksPerDay.push(0); 
    }

    // 2. Setup Device and Country trackers
    const deviceCount = {};
    const countryCount = {};

    // 3. Loop through analytics exactly ONCE (O(n) time complexity)
    url.analytics.forEach(visit => {
      const visitDate = new Date(visit.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const dayIndex = last7Days.indexOf(visitDate);
      if (dayIndex !== -1) {
        clicksPerDay[dayIndex]++;
      }

      const dev = visit.device || "Unknown";
      deviceCount[dev] = (deviceCount[dev] || 0) + 1;

      const ctry = visit.country || "Unknown";
      countryCount[ctry] = (countryCount[ctry] || 0) + 1;
    });

    const chartData = {
      dates: last7Days,
      clicks: clicksPerDay,
      devices: Object.keys(deviceCount),
      deviceData: Object.values(deviceCount),
      countries: Object.keys(countryCount),
      countryData: Object.values(countryCount)
    };

    res.render("analytics", { 
      urlData: url,
      user: req.session?.user || null,
      chartData: JSON.stringify(chartData) 
    });

  } catch (err) {
    console.error("Analytics Error:", err);
    res.status(500).send("Server error");
  }
};

const deleteUrl = async (req, res) => {
  try {
    const url = await urlModel.findByIdAndUpdate(
      req.params.id,
      {
        isDeleted: true,
        deletedAt: new Date()
      },
      { new: true }
    );

    if (!url) {
      return res.status(404).json({ success: false, message: "System Reject: URL not found." });
    }

    // CACHE INVALIDATION
    // Actively destroy the cache key so the link instantly dies on the internet
    await redisClient.del(`url:${url.shortCode}`);

    res.json({ success: true, message: "URL permanently terminated." });

  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).json({ success: false, message: "Network malfunction." });
  }
};

const exploreUrl = async (req, res) => {
  try {
      const trendingUrls = await urlModel.find({ isDeleted: false })
          .sort({ clicks: -1 }) 
          .limit(12)
          .populate('createdBy', 'username'); 
          
      res.render("explore", { 
          links: trendingUrls,
          currentDomain: req.get('host')
      });
  } catch (error) {
      console.error("Explore Page Error:", error);
      res.status(500).send("Server Error loading community feed");
  }
};

export { createShortUrl, redirectUrl, getUserUrls, getUrlAnalytics, deleteUrl, exploreUrl };
document.addEventListener('DOMContentLoaded', () => {
    // 1. Grab the data from the Window object (No EJS tags here!)
    const rawData = window.chartData || { dates: [], clicks: [], devices: [], deviceData: [], countries: [], countryData: [] };
    
    console.log("Analytics Engine Started with data:", rawData);

    // 2. Global Chart Defaults
    Chart.defaults.color = 'rgba(255, 255, 255, 0.5)';
    Chart.defaults.font.family = "'Outfit', sans-serif";

    // 3. Validation: Don't render if there is no data
    if (!rawData.clicks || rawData.clicks.reduce((a, b) => a + b, 0) === 0) {
        document.querySelector('.analytics-container').insertAdjacentHTML('afterbegin', 
            '<div style="color: #ff33b5; text-align: center; margin-bottom: 20px;">No click data recorded in the last 7 days yet.</div>'
        );
        return; // Stop running the script here since there is no data to chart
    }

    // 4. Traffic Chart
    const trafficCtx = document.getElementById('trafficChart');
    if (trafficCtx) {
        new Chart(trafficCtx, {
            type: 'line',
            data: {
                labels: rawData.dates,
                datasets: [{
                    label: 'Clicks',
                    data: rawData.clicks,
                    borderColor: '#00ff41',
                    backgroundColor: 'rgba(0, 255, 65, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    // 5. Device Chart
    const deviceCtx = document.getElementById('deviceChart');
    if (deviceCtx) {
        new Chart(deviceCtx, {
            type: 'doughnut',
            data: {
                labels: rawData.devices,
                datasets: [{
                    data: rawData.deviceData,
                    backgroundColor: ['#cf30aa', '#402fb5', '#00ff41', '#ffffff'],
                    borderWidth: 0
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    // 6. Country Chart
    const countryCtx = document.getElementById('countryChart');
    if (countryCtx) {
        new Chart(countryCtx, {
            type: 'bar',
            data: {
                labels: rawData.countries,
                datasets: [{
                    label: 'Clicks',
                    data: rawData.countryData,
                    backgroundColor: '#402fb5',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
                    x: { grid: { display: false } }
                }
            }
        });
    }
});
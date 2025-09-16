// Application Data
const appData = {
    customerBehaviorData: {
        totalCustomers: 15847,
        activeNow: 342,
        avgSessionDuration: "00:08:45",
        conversionRate: 3.8,
        bounceRate: 42.5,
        pageViews: 89456,
        cartAbandonmentRate: 68.2
    },
    productDemandData: {
        topProducts: [
            {"name": "Wireless Headphones", "sales": 1243, "demand": 95, "stock": 45},
            {"name": "Smart Watch", "sales": 987, "demand": 88, "stock": 23},
            {"name": "Bluetooth Speaker", "sales": 756, "demand": 82, "stock": 67},
            {"name": "Laptop Stand", "sales": 654, "demand": 76, "stock": 12},
            {"name": "Phone Case", "sales": 543, "demand": 71, "stock": 234}
        ],
        peakHours: [
            {"hour": 0, "demand": 12}, {"hour": 1, "demand": 8}, {"hour": 2, "demand": 5},
            {"hour": 3, "demand": 3}, {"hour": 4, "demand": 2}, {"hour": 5, "demand": 4},
            {"hour": 6, "demand": 15}, {"hour": 7, "demand": 28}, {"hour": 8, "demand": 45},
            {"hour": 9, "demand": 67}, {"hour": 10, "demand": 78}, {"hour": 11, "demand": 89},
            {"hour": 12, "demand": 95}, {"hour": 13, "demand": 92}, {"hour": 14, "demand": 88},
            {"hour": 15, "demand": 85}, {"hour": 16, "demand": 91}, {"hour": 17, "demand": 96},
            {"hour": 18, "demand": 98}, {"hour": 19, "demand": 94}, {"hour": 20, "demand": 89},
            {"hour": 21, "demand": 76}, {"hour": 22, "demand": 54}, {"hour": 23, "demand": 32}
        ]
    },
    salesData: {
        totalRevenue: 284567,
        dailySales: [
            {"date": "2025-09-06", "sales": 45678},
            {"date": "2025-09-07", "sales": 52341},
            {"date": "2025-09-08", "sales": 48923},
            {"date": "2025-09-09", "sales": 56789},
            {"date": "2025-09-10", "sales": 49234},
            {"date": "2025-09-11", "sales": 53456},
            {"date": "2025-09-12", "sales": 47890}
        ],
        channelPerformance: {
            online: 65.4,
            inStore: 34.6
        }
    },
    customerSegments: {
        newCustomers: 2843,
        returningCustomers: 8934,
        vipCustomers: 1876,
        atRiskCustomers: 2194
    },
    geographicData: {
        regions: [
            {"region": "North America", "sales": 125000, "percentage": 44.2},
            {"region": "Europe", "sales": 89000, "percentage": 31.4},
            {"region": "Asia Pacific", "sales": 52000, "percentage": 18.3},
            {"region": "Others", "sales": 17567, "percentage": 6.1}
        ]
    }
};

// Chart instances
let charts = {};

// Chart colors
const chartColors = ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F', '#DB4545', '#D2BA4C', '#964325', '#944454', '#13343B'];

class RetailAnalytics {
    constructor() {
        this.currentSection = 'dashboard';
        this.updateInterval = null;
        this.activityItems = [
            "New customer from New York purchased Wireless Headphones",
            "Customer viewed Smart Watch product page",
            "Shopping cart abandoned with $124 value",
            "Customer from California completed purchase",
            "New user signed up for newsletter",
            "Product review submitted for Bluetooth Speaker",
            "Customer added Laptop Stand to wishlist",
            "Return request submitted for Phone Case",
            "Customer contacted support via chat",
            "Premium subscription activated"
        ];
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupMobileNavigation();
        this.setupFilters();
        
        // Wait for DOM to be ready then initialize everything
        setTimeout(() => {
            this.initializeAllCharts();
            this.populateProductList();
            this.startRealTimeUpdates();
        }, 100);
    }

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        const sections = document.querySelectorAll('.content-section');
        const sectionTitle = document.getElementById('section-title');

        console.log('Setting up navigation...', navItems.length, 'nav items found');

        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const sectionId = item.dataset.section;
                console.log('Navigation clicked:', sectionId);
                
                // Update active nav item
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
                
                // Show corresponding section
                sections.forEach(section => {
                    section.classList.remove('active');
                    console.log('Hiding section:', section.id);
                });
                
                const targetSection = document.getElementById(sectionId);
                if (targetSection) {
                    targetSection.classList.add('active');
                    console.log('Showing section:', sectionId);
                } else {
                    console.error('Section not found:', sectionId);
                }
                
                // Update title
                const titles = {
                    dashboard: 'Dashboard Overview',
                    behavior: 'Customer Behavior Analytics',
                    demand: 'Product Demand Analysis',
                    segments: 'Customer Segmentation',
                    sales: 'Sales Performance',
                    analytics: 'Time-based Analytics'
                };
                
                if (sectionTitle) {
                    sectionTitle.textContent = titles[sectionId] || 'Dashboard';
                }
                this.currentSection = sectionId;
                
                // Initialize section-specific charts with delay
                setTimeout(() => {
                    this.initializeSectionCharts(sectionId);
                }, 200);
            });
        });
    }

    initializeSectionCharts(sectionId) {
        console.log('Initializing charts for section:', sectionId);
        
        switch(sectionId) {
            case 'dashboard':
                if (!charts.salesTrendChart) {
                    this.initSalesTrendChart();
                }
                break;
            case 'demand':
                if (!charts.peakHoursChart) {
                    this.initPeakHoursChart();
                }
                break;
            case 'behavior':
                if (!charts.journeyChart || !charts.sessionChart) {
                    this.initBehaviorCharts();
                }
                break;
            case 'segments':
                if (!charts.segmentsChart || !charts.geographicChart) {
                    this.initSegmentCharts();
                }
                break;
            case 'sales':
                if (!charts.dailySalesChart || !charts.channelChart) {
                    this.initSalesCharts();
                }
                break;
            case 'analytics':
                if (!charts.trafficChart || !charts.seasonalChart) {
                    this.initAnalyticsCharts();
                }
                break;
        }
    }

    setupMobileNavigation() {
        const mobileToggle = document.querySelector('.mobile-nav-toggle');
        const sidebar = document.querySelector('.sidebar');

        if (mobileToggle) {
            mobileToggle.addEventListener('click', () => {
                sidebar.classList.toggle('open');
            });
        }

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && !sidebar.contains(e.target) && !mobileToggle.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        });
    }

    setupFilters() {
        // Date filter dropdown
        const dateFilter = document.getElementById('dateFilter');
        if (dateFilter) {
            dateFilter.addEventListener('change', (e) => {
                console.log('Date filter changed to:', e.target.value);
                // Add any filtering logic here
            });
        }

        // Time period filter buttons
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(f => f.classList.remove('active'));
                btn.classList.add('active');
                
                const period = btn.dataset.period;
                this.updateAnalyticsCharts(period);
            });
        });
    }

    initializeAllCharts() {
        console.log('Initializing all charts...');
        this.initSalesTrendChart();
        // Other charts will be initialized when sections are visited
    }

    initSalesTrendChart() {
        const ctx = document.getElementById('salesTrendChart');
        if (!ctx) {
            console.error('Sales trend chart canvas not found');
            return;
        }

        console.log('Initializing sales trend chart...');
        
        const dates = appData.salesData.dailySales.map(item => {
            const date = new Date(item.date);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });

        charts.salesTrendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Daily Sales',
                    data: appData.salesData.dailySales.map(item => item.sales),
                    borderColor: chartColors[0],
                    backgroundColor: chartColors[0] + '20',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: chartColors[0],
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        border: { display: false }
                    },
                    y: {
                        grid: { color: 'rgba(0,0,0,0.1)' },
                        border: { display: false },
                        ticks: {
                            callback: function(value) {
                                return '$' + (value / 1000).toFixed(0) + 'k';
                            }
                        }
                    }
                }
            }
        });
        
        console.log('Sales trend chart initialized successfully');
    }

    initPeakHoursChart() {
        const ctx = document.getElementById('peakHoursChart');
        if (!ctx) {
            console.error('Peak hours chart canvas not found');
            return;
        }

        console.log('Initializing peak hours chart...');

        const hours = appData.productDemandData.peakHours.map(item => {
            const hour = item.hour;
            const period = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
            return `${displayHour}${period}`;
        });

        charts.peakHoursChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: hours,
                datasets: [{
                    label: 'Demand Level',
                    data: appData.productDemandData.peakHours.map(item => item.demand),
                    backgroundColor: chartColors[0],
                    borderRadius: 4,
                    maxBarThickness: 30
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        border: { display: false }
                    },
                    y: {
                        grid: { color: 'rgba(0,0,0,0.1)' },
                        border: { display: false },
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
        
        console.log('Peak hours chart initialized successfully');
    }

    initBehaviorCharts() {
        console.log('Initializing behavior charts...');
        
        // Customer Journey Flow Chart
        const journeyCtx = document.getElementById('journeyChart');
        if (journeyCtx) {
            charts.journeyChart = new Chart(journeyCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Homepage', 'Product Pages', 'Cart', 'Checkout', 'Purchase'],
                    datasets: [{
                        data: [100, 75, 45, 30, 18],
                        backgroundColor: chartColors.slice(0, 5),
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                usePointStyle: true,
                                padding: 15
                            }
                        }
                    }
                }
            });
            console.log('Journey chart initialized');
        }

        // Session Duration Chart
        const sessionCtx = document.getElementById('sessionChart');
        if (sessionCtx) {
            charts.sessionChart = new Chart(sessionCtx, {
                type: 'bar',
                data: {
                    labels: ['0-2 min', '2-5 min', '5-10 min', '10-20 min', '20+ min'],
                    datasets: [{
                        label: 'Sessions',
                        data: [25, 35, 28, 15, 8],
                        backgroundColor: chartColors[1],
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        x: { grid: { display: false }, border: { display: false } },
                        y: { grid: { color: 'rgba(0,0,0,0.1)' }, border: { display: false } }
                    }
                }
            });
            console.log('Session chart initialized');
        }
    }

    initSegmentCharts() {
        console.log('Initializing segment charts...');
        
        const segmentsCtx = document.getElementById('segmentsChart');
        if (segmentsCtx) {
            const segments = appData.customerSegments;
            charts.segmentsChart = new Chart(segmentsCtx, {
                type: 'pie',
                data: {
                    labels: ['New Customers', 'Returning', 'VIP', 'At Risk'],
                    datasets: [{
                        data: [segments.newCustomers, segments.returningCustomers, segments.vipCustomers, segments.atRiskCustomers],
                        backgroundColor: chartColors.slice(0, 4),
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { usePointStyle: true, padding: 15 }
                        }
                    }
                }
            });
            console.log('Segments chart initialized');
        }

        const geoCtx = document.getElementById('geographicChart');
        if (geoCtx) {
            const regions = appData.geographicData.regions;
            charts.geographicChart = new Chart(geoCtx, {
                type: 'bar',
                data: {
                    labels: regions.map(r => r.region),
                    datasets: [{
                        label: 'Sales ($)',
                        data: regions.map(r => r.sales),
                        backgroundColor: chartColors[2],
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { display: false }, border: { display: false } },
                        y: { 
                            grid: { color: 'rgba(0,0,0,0.1)' }, 
                            border: { display: false },
                            ticks: {
                                callback: function(value) {
                                    return '$' + (value / 1000).toFixed(0) + 'k';
                                }
                            }
                        }
                    }
                }
            });
            console.log('Geographic chart initialized');
        }
    }

    initSalesCharts() {
        console.log('Initializing sales charts...');
        
        const dailySalesCtx = document.getElementById('dailySalesChart');
        if (dailySalesCtx) {
            const dates = appData.salesData.dailySales.map(item => {
                const date = new Date(item.date);
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            });

            charts.dailySalesChart = new Chart(dailySalesCtx, {
                type: 'line',
                data: {
                    labels: dates,
                    datasets: [{
                        label: 'Daily Sales',
                        data: appData.salesData.dailySales.map(item => item.sales),
                        borderColor: chartColors[3],
                        backgroundColor: chartColors[3] + '20',
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: chartColors[3],
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { display: false }, border: { display: false } },
                        y: { 
                            grid: { color: 'rgba(0,0,0,0.1)' }, 
                            border: { display: false },
                            ticks: {
                                callback: function(value) {
                                    return '$' + (value / 1000).toFixed(0) + 'k';
                                }
                            }
                        }
                    }
                }
            });
            console.log('Daily sales chart initialized');
        }

        const channelCtx = document.getElementById('channelChart');
        if (channelCtx) {
            const channelData = appData.salesData.channelPerformance;
            charts.channelChart = new Chart(channelCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Online', 'In-Store'],
                    datasets: [{
                        data: [channelData.online, channelData.inStore],
                        backgroundColor: [chartColors[4], chartColors[5]],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { usePointStyle: true, padding: 15 }
                        }
                    }
                }
            });
            console.log('Channel chart initialized');
        }
    }

    initAnalyticsCharts() {
        console.log('Initializing analytics charts...');
        
        const trafficCtx = document.getElementById('trafficChart');
        if (trafficCtx) {
            charts.trafficChart = new Chart(trafficCtx, {
                type: 'line',
                data: {
                    labels: ['12 AM', '3 AM', '6 AM', '9 AM', '12 PM', '3 PM', '6 PM', '9 PM'],
                    datasets: [{
                        label: 'Traffic',
                        data: [20, 12, 45, 78, 95, 89, 96, 65],
                        borderColor: chartColors[6],
                        backgroundColor: chartColors[6] + '20',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { display: false }, border: { display: false } },
                        y: { grid: { color: 'rgba(0,0,0,0.1)' }, border: { display: false } }
                    }
                }
            });
            console.log('Traffic chart initialized');
        }

        const seasonalCtx = document.getElementById('seasonalChart');
        if (seasonalCtx) {
            charts.seasonalChart = new Chart(seasonalCtx, {
                type: 'bar',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                    datasets: [{
                        label: 'Monthly Trends',
                        data: [65, 70, 75, 80, 85, 78, 72, 68, 82, 88, 95, 110],
                        backgroundColor: chartColors[7],
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { display: false }, border: { display: false } },
                        y: { grid: { color: 'rgba(0,0,0,0.1)' }, border: { display: false } }
                    }
                }
            });
            console.log('Seasonal chart initialized');
        }
    }

    populateProductList() {
        const productList = document.getElementById('productList');
        if (!productList) {
            console.error('Product list container not found');
            return;
        }

        console.log('Populating product list...');

        productList.innerHTML = appData.productDemandData.topProducts.map(product => {
            const stockLevel = product.stock < 30 ? 'low' : product.stock < 100 ? 'medium' : 'high';
            const stockText = product.stock < 30 ? 'Low Stock' : product.stock < 100 ? 'Medium Stock' : 'In Stock';

            return `
                <div class="product-item">
                    <div class="product-info">
                        <div class="product-name">${product.name}</div>
                        <div class="product-stats">
                            <span class="product-stat">Sales: ${product.sales}</span>
                            <span class="product-stat">Stock: ${product.stock}</span>
                        </div>
                    </div>
                    <div class="demand-indicator">
                        <div class="demand-bar">
                            <div class="demand-fill" style="width: ${product.demand}%"></div>
                        </div>
                        <span>${product.demand}%</span>
                    </div>
                    <div class="stock-status ${stockLevel}">${stockText}</div>
                </div>
            `;
        }).join('');
        
        console.log('Product list populated successfully');
    }

    updateKPIs() {
        // Simulate real-time KPI updates
        const activeCustomers = document.getElementById('activeCustomers');
        const pageViews = document.getElementById('pageViews');
        const conversionRate = document.getElementById('conversionRate');

        if (activeCustomers) {
            const currentActive = parseInt(activeCustomers.textContent);
            const variation = Math.floor(Math.random() * 10) - 5;
            activeCustomers.textContent = Math.max(0, currentActive + variation);
        }

        if (pageViews) {
            const currentViews = parseInt(pageViews.textContent.replace(/,/g, ''));
            const viewsIncrease = Math.floor(Math.random() * 50) + 10;
            pageViews.textContent = (currentViews + viewsIncrease).toLocaleString();
        }

        if (conversionRate) {
            const currentRate = parseFloat(conversionRate.textContent.replace('%', ''));
            const rateChange = (Math.random() * 0.2) - 0.1;
            conversionRate.textContent = Math.max(0, currentRate + rateChange).toFixed(1) + '%';
        }
    }

    updateActivityFeed() {
        const activityFeed = document.getElementById('activityFeed');
        if (!activityFeed) return;

        // Add new activity item
        const randomActivity = this.activityItems[Math.floor(Math.random() * this.activityItems.length)];
        const timeAgo = Math.floor(Math.random() * 10) + 1;
        
        const newItem = document.createElement('div');
        newItem.className = 'activity-item';
        newItem.innerHTML = `
            <span class="activity-time">${timeAgo} min ago</span>
            <span class="activity-text">${randomActivity}</span>
        `;

        activityFeed.insertBefore(newItem, activityFeed.firstChild);

        // Keep only last 10 items
        while (activityFeed.children.length > 10) {
            activityFeed.removeChild(activityFeed.lastChild);
        }
    }

    updateAnalyticsCharts(period) {
        if (charts.trafficChart) {
            const data = {
                hourly: [20, 12, 45, 78, 95, 89, 96, 65],
                daily: [150, 220, 180, 290, 340, 280, 380],
                weekly: [1200, 1450, 1380, 1620, 1890, 1720, 1950]
            };

            const labels = {
                hourly: ['12 AM', '3 AM', '6 AM', '9 AM', '12 PM', '3 PM', '6 PM', '9 PM'],
                daily: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                weekly: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7']
            };

            charts.trafficChart.data.labels = labels[period];
            charts.trafficChart.data.datasets[0].data = data[period];
            charts.trafficChart.update();
        }
    }

    startRealTimeUpdates() {
        console.log('Starting real-time updates...');
        // Update every 5 seconds
        this.updateInterval = setInterval(() => {
            this.updateKPIs();
            this.updateActivityFeed();
        }, 5000);
    }

    stopRealTimeUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing Retail Analytics...');
    new RetailAnalytics();
});

// Handle window resize for responsive charts
window.addEventListener('resize', () => {
    Object.values(charts).forEach(chart => {
        if (chart && typeof chart.resize === 'function') {
            chart.resize();
        }
    });
});

// Add keyboard navigation support
document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
        // Ensure proper tab navigation
        const focusableElements = document.querySelectorAll('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])');
        const focusedElement = document.activeElement;
        const focusedIndex = Array.from(focusableElements).indexOf(focusedElement);
        
        if (e.shiftKey && focusedIndex === 0) {
            e.preventDefault();
            focusableElements[focusableElements.length - 1].focus();
        } else if (!e.shiftKey && focusedIndex === focusableElements.length - 1) {
            e.preventDefault();
            focusableElements[0].focus();
        }
    }
});

// Accessibility enhancements
document.addEventListener('DOMContentLoaded', () => {
    // Add ARIA labels to charts
    const chartCanvases = document.querySelectorAll('canvas');
    chartCanvases.forEach((canvas, index) => {
        canvas.setAttribute('role', 'img');
        canvas.setAttribute('aria-label', `Chart ${index + 1}: Interactive data visualization`);
    });
    
    // Add keyboard navigation hints
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.setAttribute('tabindex', '0');
        item.setAttribute('role', 'button');
        
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                item.click();
            }
        });
    });
});

// Chart.js tooltip customization
Chart.defaults.plugins.tooltip.callbacks.label = function(context) {
    let label = context.dataset.label || '';
    if (label) {
        label += ': ';
    }
    
    if (context.parsed.y !== null) {
        const value = context.parsed.y;
        if (typeof value === 'number') {
            if (value > 1000) {
                label += '$' + (value / 1000).toFixed(1) + 'k';
            } else {
                label += value.toLocaleString();
            }
        }
    }
    
    return label;
};
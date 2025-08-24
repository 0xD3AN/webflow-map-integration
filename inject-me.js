(function () {
    /// Defines the target <div> element used to create the chart.
    const CHART_ELEMENT_ID = 'us-map';

    /// Helper function for lazy-loading a script. In this case, it is
    /// exclusivelly used for loading AmCharts dependencies.
    const loadScriptAsync = (src) => new Promise((resolve, reject) => {
        // if there already is a script tag that matches the target source, return success
        if ([...document.scripts].some(s => s.src === src)) return resolve();

        // instantiate and initialize the script element
        const newScriptElem = document.createElement('script');
        newScriptElem.src = src;
        newScriptElem.async = true;
        newScriptElem.onload = () => resolve();
        newScriptElem.onerror = (err) => {
            reject(new Error(`Failed to load script ${src}\nReason: ${err.message || 'unknown error'}`));
        };

        document.head.appendChild(newScriptElem);
    });

    // initializes the US map and plots the data series
    window.initUSMap = async function initUSMap(opts = {}) {
        if (!window.am5 || !window.am5map || !window.am5geodata_usaLow) {
            await loadScriptAsync("https://cdn.amcharts.com/lib/5/index.js");
            await loadScriptAsync("https://cdn.amcharts.com/lib/5/map.js");
            await loadScriptAsync("https://cdn.amcharts.com/lib/5/geodata/usaLow.js"); // US states
            await loadScriptAsync("https://cdn.amcharts.com/lib/5/themes/Animated.js");
        }


        // wait until the AmCharts 5 API is ready
        am5.ready(function () {
            var chartRoot = am5.Root.new(CHART_ELEMENT_ID);
            chartRoot.setThemes([
                am5themes_Animated.new(chartRoot)
            ]);

            var chart = chartRoot.container.children.push(
                am5map.MapChart.new(chartRoot, {
                    panX: "rotateX",
                    projection: am5map.geoAlbersUsa()
                })
            );

            // Create polygon series
            var polygonSeries = chart.series.push(
                am5map.MapPolygonSeries.new(chartRoot, {
                    geoJSON: am5geodata_usaLow
                })
            );

            polygonSeries.mapPolygons.template.setAll({
                tooltipText: "{name}"
            });

            polygonSeries.mapPolygons.template.states.create("hover", {
                fill: am5.color(0x297373)
            });

            var zoomOut = chartRoot.tooltipContainer.children.push(am5.Button.new(chartRoot, {
                x: am5.p100,
                y: 0,
                centerX: am5.p100,
                centerY: 0,
                paddingTop: 18,
                paddingBottom: 18,
                paddingLeft: 12,
                paddingRight: 12,
                dx: -20,
                dy: 20,
                themeTags: ["zoom"],
                icon: am5.Graphics.new(chartRoot, {
                    themeTags: ["button", "icon"],
                    strokeOpacity: 0.7,
                    draw: function (display) {
                        display.moveTo(0, 0);
                        display.lineTo(12, 0);
                    }
                })
            }));

            zoomOut.get("background").setAll({
                cornerRadiusBL: 40,
                cornerRadiusBR: 40,
                cornerRadiusTL: 40,
                cornerRadiusTR: 40
            });
            zoomOut.events.on("click", function () {
                if (currentSeries) {
                    currentSeries.hide();
                }
                chart.goHome();
                zoomOut.hide();
                currentSeries = regionalSeries.US.series;
                currentSeries.show();
            });
            zoomOut.hide();
        });
    };

    // Auto-init if the container exists (simple, works well on Webflow pages)
    document.addEventListener("DOMContentLoaded", () => {
        const USMapDiv = document.getElementById(CHART_ELEMENT_ID);
        if (!USMapDiv) {
            console.error('Unable to locate map element for init.');
            return;
        }

        window.initUSMap();
    });
})();
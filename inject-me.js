(function () {
    /// Defines the target <div> element used to create the chart.
    const CHART_ELEMENT_ID = 'us-map';
    const locationCountsByZone = {};

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
        // load the AmChart dependencies
        if (!window.am5 || !window.am5map || !window.am5geodata_usaLow) {
            await loadScriptAsync("https://cdn.amcharts.com/lib/5/index.js");
            await loadScriptAsync("https://cdn.amcharts.com/lib/5/map.js");
            await loadScriptAsync("https://cdn.amcharts.com/lib/5/geodata/usaLow.js");
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

            var polygonSeries = chart.series.push(
                am5map.MapPolygonSeries.new(chartRoot, {
                    geoJSON: am5geodata_usaLow,
                    fill: am5.color(0x404040),   // light gray fill
                    stroke: am5.color(0xffffff)  // white borders
                })
            );

            polygonSeries.mapPolygons.template.setAll({
                tooltipText: "{name}"
            });

            polygonSeries.mapPolygons.template.states.create("hover", {
                fill: am5.color(0xd4b46c)
            });

            // create a dynamic zoomout button
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

            var regionalSeries = {};
            var currentSeries;

            var locationData = {
                "query_results": [
                    {
                        "co_loc_n": "Lake Charles",
                        "MAIL_ST_PROV_C": "LA",
                        "LNGTD_I": "-93.2174000",
                        "LATTD_I": "30.2266000",
                        "mail_city_n": "Lake Charles"
                    },
                    {
                        "co_loc_n": "Gurnee",
                        "MAIL_ST_PROV_C": "IL",
                        "LNGTD_I": "-87.90200000",
                        "LATTD_I": "42.37030000",
                        "mail_city_n": "Gurnee"
                    },
                    {
                        "co_loc_n": "Gurnee",
                        "MAIL_ST_PROV_C": "IL",
                        "LNGTD_I": "-87.90200000",
                        "LATTD_I": "42.37030000",
                        "mail_city_n": "Gurnee"
                    },
                    {
                        "co_loc_n": "Rockville",
                        "MAIL_ST_PROV_C": "MD",
                        "LNGTD_I": "-77.15280000",
                        "LATTD_I": "39.08400000",
                        "mail_city_n": "Rockville"
                    },
                    {
                        "co_loc_n": "Houston",
                        "MAIL_ST_PROV_C": "TX",
                        "LNGTD_I": "-95.37010000",
                        "LATTD_I": "29.76010000",
                        "mail_city_n": "Houston"
                    },
                    {
                        "co_loc_n": "Flower Mound",
                        "MAIL_ST_PROV_C": "TX",
                        "LNGTD_I": "-97.09700000",
                        "LATTD_I": "33.01460000",
                        "mail_city_n": "Flower Mound"
                    },
                    {
                        "co_loc_n": "McAllen",
                        "MAIL_ST_PROV_C": "TX",
                        "LNGTD_I": "-98.23000000",
                        "LATTD_I": "26.20340000",
                        "mail_city_n": "McAllen"
                    },
                    {
                        "co_loc_n": "Waxahachie",
                        "MAIL_ST_PROV_C": "TX",
                        "LNGTD_I": "-96.84880000",
                        "LATTD_I": "32.38630000",
                        "mail_city_n": "Waxahachie"
                    }
                ]
            };

            polygonSeries.events.on("datavalidated", function () {
                setupLocations(locationData);
            });

            function setupLocations(data) {
                var theSeries = createSeries("locationCountsByState");
                regionalSeries.US = {
                    markerData: [],
                    series: theSeries
                };

                currentSeries = regionalSeries.US.series;

                am5.array.each(data.query_results, function (loc) {
                    var location = {
                        stateName: loc.MAIL_ST_PROV_C,
                        long: am5.type.toNumber(loc.LNGTD_I),
                        lat: am5.type.toNumber(loc.LATTD_I),
                        cityName: loc.mail_city_n,
                        geoKey: `${loc.mail_city_n}|${loc.MAIL_ST_PROV_C}`
                    };

                    // add another location to the city's quantity
                    locationCountsByZone[location.geoKey] = (locationCountsByZone[location.geoKey] || 0) + 1;

                    // add another location to the state's quantity for the regional map
                    locationCountsByZone[location.stateName] = (locationCountsByZone[location.stateName] || 0) + 1;

                    // the regional series is keyed by state name
                    if (regionalSeries[location.stateName] == undefined) {
                        var statePolygon = getPolygon("US-" + location.stateName);
                        if (statePolygon) {
                            var centroid = statePolygon.visualCentroid();

                            regionalSeries[location.stateName] = {
                                target: location.stateName,
                                type: "state",
                                name: statePolygon.dataItem.dataContext.name,
                                locationCount: locationCountsByZone[location.stateName] || 0,
                                stateName: location.stateName,
                                markerData: [],
                                geometry: {
                                    type: "Point",
                                    coordinates: [centroid.longitude, centroid.latitude]
                                }
                            };
                            regionalSeries.US.markerData.push(regionalSeries[location.stateName]);

                        }
                        else {
                            return;
                        }
                    }
                    else {
                        regionalSeries[location.stateName].locationCount++;
                    }

                    if (regionalSeries[location.cityName] == undefined) {
                        regionalSeries[location.cityName] = {
                            target: location.cityName,
                            type: "city",
                            name: location.cityName,
                            locationCount: 1,
                            stateName: location.stateName,
                            markerData: [],
                            geometry: {
                                type: "Point",
                                coordinates: [location.long, location.lat]
                            }
                        };
                        regionalSeries[location.stateName].markerData.push(regionalSeries[location.cityName]);
                    }
                    else {
                        regionalSeries[location.cityName].locationCount++;
                    }

                    regionalSeries[location.cityName].markerData.push({
                        name: location.cityName,
                        locationCount: 1,
                        stateName: location.stateName,
                        geometry: {
                            type: "Point",
                            coordinates: [location.long, location.lat]
                        }
                    });

                });
                console.log(regionalSeries.US.markerData)
                regionalSeries.US.series.data.setAll(regionalSeries.US.markerData);
            }

            function getPolygon(id) {
                var found;
                polygonSeries.mapPolygons.each(function (polygon) {
                    if (polygon.dataItem.get("id") == id) {
                        found = polygon;
                    }
                })
                return found;
            }

            function createSeries(heatfield) {
                var pointSeries = chart.series.push(
                    am5map.MapPointSeries.new(chartRoot, {
                        valueField: heatfield,
                        calculateAggregates: true
                    })
                );

                var circleTemplate = am5.Template.new(chartRoot);
                pointSeries.bullets.push(function () {
                    var container = am5.Container.new(chartRoot, {});

                    var circle = container.children.push(am5.Circle.new(chartRoot, {
                        radius: 10,
                        fill: am5.color(0x97692f),
                        fillOpacity: 0.7,
                        cursorOverStyle: "pointer",
                        tooltipText: "{name}:\n[bold]{locationCount} locations[/]"
                    }, circleTemplate));

                    var label = container.children.push(am5.Label.new(chartRoot, {
                        text: "{locationCount}",
                        fill: am5.color(0xffffff),
                        populateText: true,
                        centerX: am5.p50,
                        centerY: am5.p50,
                        textAlign: "center"
                    }));

                    circle.events.on("click", function (ev) {
                        var data = ev.target.dataItem.dataContext;

                        if (data.type != 'state')
                            return;

                        if (!data.target) {
                            return;
                        }

                        if (!regionalSeries[data.target].series) {
                            regionalSeries[data.target].series = createSeries("count");
                            regionalSeries[data.target].series.data.setAll(data.markerData);
                        }

                        if (currentSeries) {
                            currentSeries.hide();
                        }

                        var statePolygon = getPolygon("US-" + data.stateName);
                        polygonSeries.zoomToDataItem(statePolygon.dataItem);

                        zoomOut.show();

                        currentSeries = regionalSeries[data.target].series;
                        currentSeries.show();
                    });

                    return am5.Bullet.new(chartRoot, {
                        sprite: container
                    });
                });

                pointSeries.set("heatRules", [{
                    target: circleTemplate,
                    dataField: "value",
                    min: 10,
                    max: 30,
                    key: "radius"
                }]);

                return pointSeries;
            }

            // wait for load
            //window.setTimeout(() => {
            //    setupLocations(locationData);
            //}, 100);
        });
    };

    document.addEventListener("DOMContentLoaded", () => {
        const USMapDiv = document.getElementById(CHART_ELEMENT_ID);
        if (!USMapDiv) {
            console.error('Unable to locate map element for init.');
            return;
        }

        window.initUSMap();
    });
})();
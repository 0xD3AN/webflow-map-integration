## Introduction

This repository contains a script module used for embedding into a WebFlow application builder. Open **index.html** in any web browser to see the module's use in a test environment that simulates a lightweight, static page from a website builder. The map/chart depends on the presence of a \<div> element with an ID attribute of "us-map". The script lazy-loads the AmCharts dependencies into the **document.head** section and creates the chart of the U.S. states.

Each state may contain a quantity of the "target item" with a popup overlay for item details and a drilldown functionality for further state-level details.

Note that the chart datasource is embedded as a single JS array. Add or remove items as needed.

## Credits

1) This project uses AmCharts, found at: https://www.amcharts.com. Note that it is required to keep the link for AmCharts present on the page or a license will need to be purchased.

2) The *TargetStores.json* file, used only during devlopment and testing, is credited to the AmCharts documentation via: https://www.amcharts.com/demos/map-image-drill-down/

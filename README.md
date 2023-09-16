# ccc-api

## about

A simple REST API built using Node.js that combines data from two third-party APIs that prioritizes effiency, simplicity and accuracy for the caller.

Responds with data that can be used to analyze a correlation between C02 intensity and [risk of infection](https://cires.colorado.edu/news/carbon-dioxide-levels-reflect-covid-risk)/risk of death due to Covid-19.

### [Carbon Intensity API (UK)](https://carbon-intensity.github.io/api-definitions/#carbon-intensity-api-v2-0-0)
### [Covid-19 API (UK)](https://coronavirus.data.gov.uk/details/developers-guide/generic-api)

## database

Uses a firestone realtime database to cache responses to call, with the goal of greatly improving the respose time of this API as well as the heavy cost of calling the Carbon Intensity API.

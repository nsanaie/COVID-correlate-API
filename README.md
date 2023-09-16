# ccc-api

## About

A simple REST API built using Node.js that combines data from two third-party APIs that prioritizes effiency, simplicity and accuracy for the caller.

Responds with data that can be used to analyze a correlation between C02 intensity and [risk of infection](https://cires.colorado.edu/news/carbon-dioxide-levels-reflect-covid-risk)/risk of death due to Covid-19.

### [Carbon Intensity API (UK)](https://carbon-intensity.github.io/api-definitions/#carbon-intensity-api-v2-0-0)
### [Covid-19 API (UK)](https://coronavirus.data.gov.uk/details/developers-guide/generic-api)

## Documentation

Coming soon.

## Database

Uses a firestone realtime database to cache responses to calls, with the goal of greatly improving the respose time of this API as well as the heavy cost of calling the Carbon Intensity API.

## Dependencies

* [express](https://www.npmjs.com/package/express) version 4.18.2
* [nodemon](https://www.npmjs.com/package/nodemon) version 3.0.1
* [firebase-admin](https://www.npmjs.com/package/firebase-admin) version 11.10.1
* [moment](https://www.npmjs.com/package/moment) version 2.29.4

## Use

* Download Node.JS version 12 or later, and clone/download this repository.
* Install the dependencies with the `npm install` command.
* Add your own serviceAccount.json for use of firebase realtime database
* After that, just run it with the `npm start` command and you're done!

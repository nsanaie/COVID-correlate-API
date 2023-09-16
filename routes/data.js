const express = require('express');
const moment = require('moment')
const router = express.Router();

const admin = require('firebase-admin')
const serviceAccount = require('../ccc-api-cache-firebase-adminsdk-7q9at-bc9c8381e2.json')

const app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://ccc-api-cache-default-rtdb.firebaseio.com/",
    apiKey: "AIzaSyCBhZ_tKucLUMl5ojBAehHiEtWXN-cj9z4",
    authDomain: "ccc-api-cache.firebaseapp.com",
    projectId: "ccc-api-cache",
    storageBucket: "ccc-api-cache.appspot.com",
    messagingSenderId: "299352874364",
    appId: "1:299352874364:web:a703a28f92702b36df18f9",
    measurementId: "G-X4YBB8ZMFS",
    databaseURL: "https://ccc-api-cache-default-rtdb.firebaseio.com/",
});

const db = app.database();
const ref = db.ref('cache/regions')

// mapping inputs to match both API calls
// covid-19 data is missing some specific regions, like north and south wales, so instead return the more broad region for the covid-19 data
// add a message to the data explaining why this is the case

// regionId: [areaType, fullName, areaName, approximation?]

const areaHandling = {
    "1": ["nation", "North Scotland", "Scotland", true],
    "2": ["nation", "South Scotland", "Scotland", true],
    "3": ["region", "North West England", "North%20West", false],
    "4": ["region", "North East England", "North%20East", false],
    "5": ["region", "Yorkshire", "Yorkshire%20and%20The%20Humber", false],
    "6": ["nation", "North Wales", "Wales", true],
    "7": ["nation", "South Wales", "Wales", true],
    "8": ["region", "West Midlands", "West%20Midlands", false],
    "9": ["region", "East Midlands", "East%20Midlands", false],
    "10": ["region", "East England", "East%20of%20England", false],
    "11": ["region", "South West England", "South%20West", false],
    "12": ["region", "South England", "South%20East", true],
    "13": ["region", "London", "London", false],
    "14": ["region", "South East England", "South%20East", false],
    "15": ["nation", "England", "England", false],
    "16": ["nation", "Scotland", "Scotland", false],
    "17": ["nation", "Wales", "Wales", false],
}

router.get('/', (req, res) => {
    res.send(test())
})

router.get('/combined/:region/:date', (req, res) => {

    var errorReason = ""
    var code = 200

    date = req.params.date = req.params.date + "T00:30"
    const dateObject = moment(req.params.date, "YYYY-MM-DDTHH:mm", true);   

    try {
        if (!(req.params.region in areaHandling)){
            code = 400;
            errorReason = "Bad Request";
            throw new Error('Only use a valid region ID in the inclusive range 1-17. Example: 15');
        }
        if (!(dateObject.isValid())){
            code = 400;
            errorReason = "Bad Request";
            throw new Error('Only use valid dates in the format YYYY-MM-DD. Example 2022-09-25')
        }
        if (dateObject.isAfter(moment())){
            code = 400;
            errorReason = "Bad Request";
            throw new Error('Only use valid dates that are not in the future')
        }
        getCombinedData(req.params.region, dateObject).then(data => {
            res.status(code).send(data)
        })
    } catch(error) {
        res.status(code).send({
            "error": {
                "code": `${code} ${errorReason}`,
                "message": error.message
            }
        })
    }
})

router.get('/combined/:region/:startDate/:endDate/', (req, res) => {
    var errorReason = ""
    var code = 200

    startDate = req.params.startDate = req.params.startDate + "T00:30"
    endDate = req.params.endDate = req.params.endDate + "T00:00"
    const startObject = moment(req.params.startDate, "YYYY-MM-DDTHH:mm", true);
    const limitObject = moment(req.params.startDate, "YYYY-MM-DDTHH:mm", true).add("60", "d")
    const endObject = moment(req.params.endDate, "YYYY-MM-DDTHH:mm", true);

    try {
        if (!(req.params.region in areaHandling)){
            code = 400;
            errorReason = "Bad Request";
            throw new Error('Only use a valid region ID in the inclusive range 1-17. Example: 5');
        }
        if (!(startObject.isValid() && endObject.isValid())){
            code = 400;
            errorReason = "Bad Request";
            throw new Error('Only use valid dates in the format YYYY-MM-DD. Example: 2022-09-25')
        }
        if (startObject.isAfter(moment()) || endObject.isAfter(moment())){
            code = 400;
            errorReason = "Bad Request";
            throw new Error('Only use valid dates that are not in the future.')
        }
        if (startObject.isBefore(moment("1000-01-01"))){
            code = 400;
            errorReason = "Bad Request";
            throw new Error('Cannot use dates so far in the past.')
        }
        if (startObject.isAfter(endObject)){
            code = 400;
            errorReason = "Bad Request";
            throw new Error('Cannot input a starting date that is after the ending date.')
        }
        if (limitObject.isBefore(endObject)){
            code = 400;
            errorReason = "Bad Request";
            throw new Error('Only use date ranges smaller than or equal to 60 days. Select a smaller date range.')
        }
        getCombinedData(req.params.region, startObject, endObject).then(data => {
            res.status(code).send(data)
        })
    } catch(error) {
        res.status(code).send({
            "error": {
                "code": `${code} ${errorReason}`,
                "message": error.message
            }
        })
    }
})

// fetch data for combined carbon intensity and covid-19 data

const getCombinedData = async (region, startDate, endDate) => {

    let result = {
        "regionId": region,
        "carbonDataRegion": areaHandling[region][1],
        "covidDataRegion": areaHandling[region][3] ? areaHandling[region][2] : areaHandling[region][1]
    };

    if (endDate) {

        let string = startDate.format("YYYY-MM-DD") + endDate.format("YYYY-MM-DD")
        let linkRef = ref.child('links')

        let carbonData = await linkRef.child(string).once('value')
        carbonData = carbonData.val()


        if (carbonData === null){          
            try {
                var carbonResponse = await fetch(`https://api.carbonintensity.org.uk/regional/intensity/${startDate.format("YYYY-MM-DDTHH:mm")}Z/${endDate.format("YYYY-MM-DDTHH:mm")}Z/regionid/${region}`);
                carbonData = await carbonResponse.json();
            } catch (error) {
                return {"error": {
                    "code": "500 Internal Server Error",
                    "message": "carbon intensity API server issue"
                }}
            }
            temp = {}
            temp[string] = carbonData
            linkRef.set(temp)
        }

        try {
            var covidResponse = await fetch(`https://api.coronavirus.data.gov.uk/v1/data?filters=areaName=${areaHandling[region][2]};areaType=${areaHandling[region][0]}&structure={"date":"date", "newDeaths":"newDeaths28DaysByDeathDate"}`)
        } catch (error) {
            return {"error": {
                "code": "500 Internal Server Error",
                "message": "covid-19 API server issue"
            }}
        }
        var covidData = undefined;
        try {
            covidData = await covidResponse.json();
        } catch {
            covidData = undefined;
        }

        dateOriented = {}
        
        for (let i = 0; i < covidData.data.length; i++){
            dateOriented[covidData.data[i].date] = covidData.data[i].newDeaths
        }

        result.combinedData = []
        var i = 0

        while (startDate.isBefore(endDate)){
            data = {
                "date": startDate.format("YYYY-MM-DD")
            }

            let dateRef = ref.child(region).child(startDate.format("YYYY-MM-DD"))
            let cache = await dateRef.once('value')
            cache = cache.val()

            console.log(cache)

            if (cache !== null){
                result.combinedData.push({
                    "date": startDate.format("YYYY-MM-DD"),
                    "intensity": cache.carbonDataObtained ? {
                        "max": cache.intensity.max,
                        "average": cache.intensity.average,
                        "low": cache.intensity.low
                    } : undefined,
                    "newDeaths": cache.covidDataObtained ? cache.newDeaths : undefined,
                    "carbonDataObtained": cache.carbonDataObtained,
                    "covidDataObtained": cache.covidDataObtained,
                })
                startDate.add("1", "d")
            } else {

                let newDeaths = dateOriented[startDate.format("YYYY-MM-DD")];

                let forecastSum = 0;
                let forecastHigh = 0;
                let forecastLow = Math.pow(10, 1000);
                let forecastAverage = 0;
                let count = 0;
                // calculate max, min, sum of carbon data for one day
                if (carbonData !== null && 'data' in carbonData && Object.keys(carbonData).length !== 0){
                    while (i < carbonData.data.data.length) {
                        curr = startDate.format("YYYY-MM-DD")

                        forecastSum += carbonData.data.data[i].intensity.forecast;
                        forecastHigh = Math.max(forecastHigh, carbonData.data.data[i].intensity.forecast)
                        forecastLow = Math.min(forecastLow, carbonData.data.data[i].intensity.forecast)
                        count += 1;
                        i += 1;

                        startDate.add("30", "m")

                        // when reaching a new day
                        if (curr !== startDate.format("YYYY-MM-DD")){
                            forecastAverage = Math.round(forecastSum / count)
                            break;
                        }
                    }
                    var carbonDataObtained = true;
                } else {
                    var carbonDataObtained = false;
                }

                if (carbonDataObtained){
                    data.intensity = {
                        "max": forecastHigh,
                        "average": forecastAverage,
                        "low": forecastLow
                    }
                }

                if (newDeaths){
                    data.newDeaths = newDeaths
                    covidDataObtained = true;
                } else {
                    covidDataObtained = false;
                }

                data.carbonDataObtained = carbonDataObtained;
                data.covidDataObtained = covidDataObtained;

                dateRef.set(data);
                result.combinedData.push(data);
            }
        }
    } else {

        let dateRef = ref.child(region).child(startDate.format("YYYY-MM-DD"))
        let cache = await dateRef.once('value')
        cache = cache.val()

        result.combinedData = [];

        if (cache !== null){
            result.combinedData.push({
                "date": cache.date,
                "intensity": cache.carbonDataObtained ? {
                    "max": cache.intensity.max,
                    "average": cache.intensity.average,
                    "low": cache.intensity.low
                } : undefined,
                "newDeaths": cache.covidDataObtained ? cache.newDeaths : undefined,
                "carbonDataObtained": cache.carbonDataObtained,
                "covidDataObtained": cache.covidDataObtained,
            })
        } else {
            data = {
                "date": startDate.format("YYYY-MM-DD")
            }

            try {
                var carbonResponse = await fetch(`https://api.carbonintensity.org.uk/regional/intensity/${startDate.format("YYYY-MM-DDTHH:mm")}Z/fw24h/regionid/${region}`);
                var carbonData = await carbonResponse.json();
            } catch (error) {
                return {"error": {
                    "code": "500 Internal Server Error",
                    "message": "carbon intensity API server issue"
                }}
            }

            let forecastSum = 0;
            let forecastHigh = 0;
            let forecastLow = Math.pow(10, 1000);
            let count = 0;

            if (carbonData !== null && 'data' in carbonData && Object.keys(carbonData).length !== 0){
                var carbonDataObtained = true;
                for (let i = 0; i < carbonData.data.data.length-1; i++) {
                    console.log(i)
                    forecastSum += carbonData.data.data[i].intensity.forecast;
                    forecastHigh = Math.max(forecastHigh, carbonData.data.data[i].intensity.forecast)
                    forecastLow = Math.min(forecastLow, carbonData.data.data[i].intensity.forecast)
                    count += 1;
                }
            } else {
                var carbonDataObtained = false;
            }
            
            let forecastAverage = Math.round(forecastSum/count);

            try {
                var covidResponse = await fetch(`https://api.coronavirus.data.gov.uk/v1/data?filters=areaName=${areaHandling[region][2]};areaType=${areaHandling[region][0]};date=${startDate.format("YYYY-MM-DD")}&structure={"date":"date", "newDeaths":"newDeaths28DaysByDeathDate"}`);
            } catch (error) {
                return {"error": {
                    "code": "500 Internal Server Error",
                    "message": "covid-19 API server issue"
                }}
            }
            var covidData = {}
            try {
                covidData = await covidResponse.json();
            } catch {
                covidData = {}
            }
            if ('data' in covidData){
                var covidDataObtained = true
            } else{
                var covidDataObtained = false
            }

            if (carbonDataObtained){
                data.intensity = {
                    "max": forecastHigh,
                    "average": forecastAverage,
                    "low": forecastLow
                }
            }
            if (covidDataObtained) {
                data.newDeaths = covidData.data[0].newDeaths
            }
            data.carbonDataObtained = carbonDataObtained
            data.covidDataObtained = covidDataObtained
            
            dateRef.set(data);
            result.combinedData.push(data);
        }




    }

    return result

}

module.exports = router;
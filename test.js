const
    AreaType = "nation",
    AreaName = "england";

const
    filters = [
        `areaType=${ AreaType }`,
        `areaName=${ AreaName }`
    ],
    structure = {
        date: "date",
        name: "areaName",
        code: "areaCode",
        "dailyCases": "newCasesByPublishDate",
        "cumulativeCases": "cumCasesByPublishDate",
        "dailyDeaths": "newDeaths28DaysByPublishDate",
        "cumulativeDeaths": "cumDeaths28DaysByPublishDate"
    };

const
    apiParams = `filters=${ filters.join(";") }&structure=${ JSON.stringify(structure) }`,
    encodedParams = encodeURI(apiParams);

console.log(`/v1/data?${ encodedParams }`);
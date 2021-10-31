function quantile(arr, q) {
    const sorted = arr.sort((a, b) => a - b);
    const pos = (sorted.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;

    if (sorted[base + 1] !== undefined) {
        return Math.floor(sorted[base] + rest * (sorted[base + 1] - sorted[base]));
    } else {
        return Math.floor(sorted[base]);
    }
};

function prepareData(result) {
	return result.data.map(item => {
		item.date = item.timestamp.split('T')[0];

		return item;
	});
}

function getMetrics(sampleData) {
	let result = {};
	result.hits = sampleData.length;
	result.p25 = quantile(sampleData, 0.25);
	result.p50 = quantile(sampleData, 0.5);
	result.p75 = quantile(sampleData, 0.75);
	result.p95 = quantile(sampleData, 0.95);

	return result;
}

function filterDataByDate(data, page, name, date) {
	return data
		.filter(item => item.page == page && item.name == name && item.date == date)
		.map(item => item.value);
}

function filterDataByPeriod(data, page, name, dateFrom, dateTo) {
	return data
		.filter(item => item.page == page && item.name == name && (item.date >= dateFrom && item.date <= dateTo))
		.map(item => item.value);
}

function addMetricByDate(data, page, name, date) {
	let sampleData = filterDataByDate(data, page, name, date)
	return getMetrics(sampleData);
}

function addMetricByPeriod(data, page, name, dateFrom, dateTo) {
	let sampleData = filterDataByPeriod(data, page, name, dateFrom, dateTo);
	return getMetrics(sampleData);
}

// TODO: реализовать
function showSession() {
	// показать сессию пользователя
}
function showMetricByLayer(data, page, metric, slice, dateFrom, dateTo) {
	//Corner cases
	if(dateFrom > dateTo) throw new Error('The beginning date of chosen Period is less than ending date');
	dateTo = checkDateTo(dateTo);
	dateFrom = dateFrom.toLocaleDateString('ko-KR').replaceAll('. ', '-').slice(0,10);
	dateTo = dateTo.toLocaleDateString('ko-KR').replaceAll('. ', '-').slice(0,10);

	let table = Object.assign({});
	let keys = Object.assign({});
	let metricData = data.filter(item => item.page == page && item.name == metric && (item.date = dateTo));

	metricData.forEach(element => keys[element.additional[slice]] = 1);
	keys = Object.keys(keys);
	for(let i = 0; i < keys.length; i++) {
		let category_snapshot = metricData.filter(item => item.additional[slice] == keys[i]).map(item => item.value);
		if(keys[i] === "" && slice === 'os') {
			table['Linux'] = getMetrics(category_snapshot);
		} else {
			table[keys[i]] = getMetrics(category_snapshot);
		}
	}
	console.log(`Slice "${slice}" of metric "${metric}" from date ${dateFrom} to date ${dateTo}`);
	console.table(table);
}
// сравнить метрику в разных срезах
function compareMetrics(data, page, dateFrom, dateTo) {
	showMetricByLayer(data, page, 'fetchGifs', 'os', dateFrom, dateTo);
	showMetricByLayer(data, page, 'fetchGifs', 'platform', dateFrom, dateTo);
	showMetricByLayer(data, page, 'fetchGifs', 'browser', dateFrom, dateTo);
}
function checkDateTo(date) {
	if(date === undefined) {
		return new Date();
	} else {
		return date > new Date() ? new Date() : date;
	}
}
// рассчитывает метрику за указанный период
function showMetricByPeriod(data, metric, page, dateFrom, dateTo) {
	//Corner cases
	if(dateFrom > dateTo) throw new Error('The beginning date of chosen Period is less than ending date');
	dateTo = checkDateTo(dateTo);

	if(dateTo.getDate() - dateFrom.getDate() === 0) {
		console.log(`${metric} for ${dateTo}:`);
	} else {
		console.log(`${metric} in period from ${dateFrom} to ${dateTo}:`);
	}
	dateFrom = dateFrom.toLocaleDateString('ko-KR').replaceAll('. ', '-').slice(0,10);
	dateTo = dateTo.toLocaleDateString('ko-KR').replaceAll('. ', '-').slice(0,10);
	let table = {};
	table[metric] = addMetricByPeriod(data, page, metric, dateFrom, dateTo);
	console.table(table);
};

// рассчитывает все метрики за указанный период
function calcMetricByPeriod(data , page, dateFrom, dateTo) {
	//Corner cases
	if(dateFrom > dateTo) throw new Error('The beginning date of chosen Period is less than ending date');
	dateTo = checkDateTo(dateTo);

	if(dateTo.getDate() - dateFrom.getDate() === 0) {
		calcMetricsByDate(data, 'Random images fetch Metrics', dateTo);
	} else {
		console.log(`All metrics in period from ${dateFrom} to ${dateTo}:`);
		dateFrom = dateFrom.toLocaleDateString('ko-KR').replaceAll('. ', '-').slice(0,10);
		dateTo = dateTo.toLocaleDateString('ko-KR').replaceAll('. ', '-').slice(0,10);

		let table = {};
		table.connect = addMetricByPeriod(data, page, 'connect', dateFrom, dateTo);
		table.ttfb = addMetricByPeriod(data, page, 'ttfb', dateFrom, dateTo);
		table.load = addMetricByPeriod(data, page, 'load', dateFrom, dateTo);
		table.backgroundChanged = addMetricByPeriod(data, page, 'backgroundChanged', dateFrom, dateTo);
		table.load = addMetricByPeriod(data, page, 'load', dateFrom, dateTo);
		table.img = addMetricByPeriod(data, page, 'img', dateFrom, dateTo);
		table.fetchGifs = addMetricByPeriod(data, page, 'fetchGifs', dateFrom, dateTo);

		console.table(table);
	}
};

// рассчитывает все метрики за день
function calcMetricsByDate(data, page, date) {
	console.log(`All metrics for ${date}:`);
	date = date.toLocaleDateString('ko-KR').replaceAll('. ', '-').slice(0,10);

	let table = {};
	table.connect = addMetricByDate(data, page, 'connect', date);
	table.ttfb = addMetricByDate(data, page, 'ttfb', date);
	table.load = addMetricByDate(data, page, 'load', date);
	table.backgroundChanged = addMetricByDate(data, page, 'backgroundChanged', date);
	table.load = addMetricByDate(data, page, 'load', date);
	table.img = addMetricByDate(data, page, 'img', date);
	table.fetchGifs = addMetricByDate(data, page, 'fetchGifs', date);

	console.table(table);
};

fetch('https://shri.yandex/hw/stat/data?counterId=fbd3c6b7-0d88-4826-ae14-d67f9027b1b3')
	.then(res => res.json())
	.then(result => {
		let data = prepareData(result);
		let testingDate = new Date('October 30, 2021');
		let currentDate = new Date();
		let page = 'third test';
		calcMetricsByDate(data, page, currentDate);
		calcMetricByPeriod(data, page, testingDate, currentDate);
		showMetricByPeriod(data, 'fetchGifs', page, testingDate, currentDate);
		compareMetrics(data, page, testingDate, currentDate);
	});

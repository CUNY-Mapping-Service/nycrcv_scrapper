const rp = require('request-promise');
const cheerio = require('cheerio');
const fs = require('fs')

const startAD = 23;
const endAD = 87;
const baseurl = "https://web.enrboenyc.us/CD24306AD"
const urlSuffix = "0.html";

let csv = "ED,Reported";

main();

async function main() {
	const numDistricts = endAD - startAD;
	for (let i = startAD; i < endAD + 1; i++) {
		console.log(`Loading Assembly District ${i}: ${((i-startAD)/numDistricts)*100}% complete`)
		const url = `${baseurl}${i}${urlSuffix}`;
		const html = await rp(url);
		const $ = cheerio.load(html);
		const eds = $('table.underline td');
		for (let ed = 0; ed < eds.length; ed++) {
			if (encodeURI(eds[ed].children[0].data) !== "%C2%A0") {
				if (eds[ed].children[0].data.includes('ED') || eds[ed].children[0].data.includes('Total')) {
					csv += '\n';
				} else {
					csv += ','
				}

				
				const csvStr = eds[ed].children[0]
					.data
					.replace(' ', '')
					.replace('ED  ', `AD${i}-ED`)
					.replace('ED   ', `AD${i}-ED`)
					.replace('ED 1', `AD${i}-ED1`)
					.replace('ED1,', 'ED 1,')
					.replace('Total', `AD${i}-Total`)
					.replace(`AD${i}-AD${i}`,`AD${i}`);

				if(!csvStr.includes('(') && !csvStr.includes('Reported')){
					csv += csvStr;
				}
				
				
			}
		}

	}
	const csvArr = csv.split('\n');
	let filteredArr = csvArr.filter(row => !row.includes('Total'))
				
	writeToCSVFile(filteredArr.join('\n'))
}

function writeToCSVFile(data) {
	const filename = 'output.csv';
	fs.writeFile(filename, data, err => {
		if (err) {
			console.log('Error writing to csv file', err);
		} else {
			console.log(`saved as ${filename}`);
		}
	});
}
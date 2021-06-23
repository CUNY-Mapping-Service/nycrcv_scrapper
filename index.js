const rp = require('request-promise');
const cheerio = require('cheerio');
const fs = require('fs');
const { start } = require('repl');

const startAD = 23;
const endAD = 87;
const baseurl = "https://web.enrboenyc.us/CD24306AD"
const urlSuffix = "0.html";

let csv = "FullID,AD,ED,Reported";

let _date = new Date();

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
					.replace('ED  ', `fid,${i},`)
					.replace('ED   ', `fid,${i},`)
					// .replace('ED 1', `AD${i}-ED1`)
					// .replace('ED1,', 'ED 1,')
					// .replace('Total', `AD${i}-Total`)
					// .replace(`AD${i}-AD${i}`,`AD${i}`);

				if(!csvStr.includes('(') && !csvStr.includes('Reported')){
					csv += csvStr;
				}
				
				
			}
		}

	}
	const csvArr = csv.split('\n');
	
	let filteredArr = csvArr.filter(row => !row.includes('Total'))
	let mappedArr = filteredArr.map((row) =>{
		let splitArray = row.split(',');
		splitArray[2] = splitArray[2].replace(' ','');
		splitArray[0]=(splitArray[1]+(splitArray[2].padStart(3, '0'))).replace(' ','');
		let joinArray = splitArray.join(',');
		return joinArray
	});
	writeToCSVFile(mappedArr.join('\n'))
}

function writeToCSVFile(data) {
	const filename = `${_date.getMonth()+1}${_date.getDate()}${_date.getHours()}${_date.getMinutes()}-output.csv`;
	fs.writeFile(filename, data, err => {
		if (err) {
			console.log('Error writing to csv file', err);
		} else {
			console.log(`saved as ${filename}`);
		}
	});
}
const rp = require('request-promise');
const cheerio = require('cheerio');
const fs = require('fs');
const {
	start
} = require('repl');

const readline = require("readline");
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let _date = new Date();

let race_base = require('./config.json');

function main(){
rl.question("Enter race (or type l to list all options):", function(cdNum) {
	if(cdNum === 'l'){
		console.log('#########################')
		console.log()
		console.log('OPTIONS:');
		Object.keys(race_base).forEach((key)=>{
			console.log('    '+key)
		});
		console.log()
		console.log('#########################')
		main();
		return;
	}

	if((!race_base[cdNum] || typeof race_base[cdNum] === 'undefined') && cdNum.substring(0,3)!=='cd_'){
		console.error('ERROR: You did not enter a valid race. Try again or type l to list all options.');
		process.exit(0);
	}
	
	let raceBase = race_base[cdNum];
	if(cdNum.substring(0,3)==='cd_'){
		const num = cdNum.replace('cd_','');
		raceBase = race_base["cd_[1-51]"].replace('%NUM%',390+parseInt(num));
		
	}
	
	const baseurl = `https://web.enrboenyc.us/${raceBase}`

	scrape(baseurl);
});
}


main();



async function scrape(baseurl) {
	const startAD = 23;
	const endAD = 87;

	const urlSuffix = "0.html";

	let csv = "FullID,AD,ED,Reported";

	const numDistricts = endAD - startAD;
	for (let i = startAD; i < endAD + 1; i++) {
		console.log(`Loading Assembly District ${i}: ${((i-startAD)/numDistricts)*100}% complete`);
		const url = `${baseurl}${i}${urlSuffix}`;
		try {
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
						.replace('ED 1', `fid,${i},1`)
					// .replace('ED 1', `AD${i}-ED1`)
					// .replace('ED1,', 'ED 1,')
					// .replace('Total', `AD${i}-Total`)
					// .replace(`AD${i}-AD${i}`,`AD${i}`);

					if (!csvStr.includes('(') && !csvStr.includes('Reported')) {
						csv += csvStr;
					}


				}
			}
		}catch(e){
			console.log("ERROR: "+e.statusCode)
		}

	}
	const csvArr = csv.split('\n');

	let filteredArr = csvArr.filter(row => !row.includes('Total'))
	let mappedArr = filteredArr.map((row) => {
		let splitArray = row.split(',');
		splitArray[2] = splitArray[2].replace(' ', '');
		splitArray[0] = (splitArray[1] + (splitArray[2].padStart(3, '0'))).replace(' ', '');
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
		process.exit(0);
	});
}
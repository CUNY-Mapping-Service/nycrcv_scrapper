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

let race_base = {
	mayor:'CD23376AD',
	public_advocate:'CD23370AD',
	city_comptroller:'CD23385AD',
	borough_president_ny:'CD23365AD',
	borough_president_bronx:'CD23366AD',
	borough_president_kings:'CD23367AD',
	borough_president_queens:'CD23368AD',
	borough_president_richmond:'CD23369AD',
	prop_1:'CD24566AD',
	prop_2:'CD24567AD',
	prop_3:'CD24568AD',
	prop_4:'CD24569AD',
	prop_5:'CD24570AD',
	"cd_[1-51]":''
}

rl.question("Enter race or type l to list all options:", function(cdNum) {
	if(cdNum === 'l'){
		console.log('#########################')
		console.log()
		console.log('OPTIONS:');
		Object.keys(race_base).forEach((key)=>{
			console.log('    '+key)
		});
		console.log()
		console.log('#########################')
		process.exit(0);
	}
	if((!race_base[cdNum] || typeof race_base[cdNum] === 'undefined') && !cdNum.includes('cd_')){
		console.error('ERROR: You did not enter a valid race. Try again or type l to list all options.');
		process.exit(0);
	}
	//
	const raceBase = cdNum.includes('cd_')? `CD23${390+cdNum}AD` : race_base[cdNum];
	const baseurl = `https://web.enrboenyc.us/${raceBase}`
	main(baseurl);
});






async function main(baseurl) {
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
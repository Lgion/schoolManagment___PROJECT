const https = require('https');

function get(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
  });
}

async function run() {
  const faGrad = await get('https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/svgs/solid/user-graduate.svg');
  const faUser = await get('https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/svgs/solid/user.svg');
  const faSchool = await get('https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/svgs/solid/school.svg');
  const faGear = await get('https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/svgs/solid/gear.svg');

  console.log('GRAD:\n' + faGrad);
  console.log('USER:\n' + faUser);
  console.log('SCHOOL:\n' + faSchool);
  console.log('GEAR:\n' + faGear);
}
run();

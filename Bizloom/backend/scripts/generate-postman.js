const fs = require('fs');
const path = require('path');
const Converter = require('openapi-to-postmanv2');

const openapiData = fs.readFileSync(path.join(__dirname, '../src/swagger.json'), { encoding: 'utf8' });

Converter.convert({ type: 'string', data: openapiData },
  { folderStrategy: 'Tags', includeAuthInfoInExample: true },
  (err, conversionResult) => {
    if (err) {
      console.error('Error converting:', err);
      return;
    }
    if (!conversionResult.result) {
      console.error('Conversion failed:', conversionResult.reason);
      return;
    }
    const outputPath = path.join(__dirname, '../../docs/Bizloom_API_Collection.postman_collection.json');
    fs.writeFileSync(outputPath, JSON.stringify(conversionResult.output[0].data, null, 2));
    console.log(`Postman collection generated at ${outputPath}`);
  }
);

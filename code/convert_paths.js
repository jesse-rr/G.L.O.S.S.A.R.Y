const fs = require('fs');
const path = require('path');

function cleanPaths(file) {
    let changed = false;
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    
    if (data.tilesets) {
        data.tilesets.forEach(ts => {
            if (ts.image) {
                // Get filename without directories
                let baseName = path.parse(ts.image).name; // 'Desert-Floor'
                
                // Add '-Sheet.png' to exactly match the target files
                let newImage = baseName + '-Sheet.png';
                
                if (ts.image !== newImage) {
                     ts.image = newImage;
                     changed = true;
                }
            }
        });
    }
    
    if (changed) {
        fs.writeFileSync(file, JSON.stringify(data, null, 2));
        console.log(`Updated paths in ${file}`);
    }
}

cleanPaths('public/assets/exports/Maps/boss-floor-abandoned.json');
cleanPaths('public/assets/exports/Maps/boss-floor-desert.json');
cleanPaths('public/assets/exports/Maps/boss-floor-mechanic.json');

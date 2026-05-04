const fs = require('fs');
const { PNG } = require('pngjs');

fs.createReadStream('/home/jrr/IdeaProjects/G.L.O.S.S.A.R.Y/code/public/assets/exports/UI/Transitions.png')
  .pipe(new PNG())
  .on('parsed', function() {
    let frameWidth = 640;
    let height = this.height;
    
    function checkAlpha(frameIndex) {
        let alphaSum = 0;
        let startX = frameIndex * frameWidth;
        for (let y = 0; y < height; y++) {
            for (let x = startX; x < startX + frameWidth; x++) {
                let idx = (this.width * y + x) << 2;
                alphaSum += this.data[idx + 3];
            }
        }
        return alphaSum / (frameWidth * height);
    }
    
    console.log("Frame 0 avg alpha:", checkAlpha.call(this, 0));
    console.log("Frame 7 avg alpha:", checkAlpha.call(this, 7));
  });

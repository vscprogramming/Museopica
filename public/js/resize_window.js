const all_canvas = document.querySelectorAll('canvas');

function resize_canvas(all_canvas) {
    let c = 0;

    all_canvas.forEach(canvas => {
        c++;
        const context = canvas.getContext('2d');

        const window_width = window.innerWidth;
        const window_height = window.innerHeight;

        let width = window_width;
        let height = window_width * 9 / 16;

        if (height > window_height) {
            height = window_height;
            width = window_height * 16 / 9;
        };

        canvas.width = width;
        canvas.height = height;

        // 背景の描画
        if (c == 1) {
            // 塗りつぶし
            context.fillStyle = '#333';
            context.fillRect(0, 0, width, height);

            // UIの描画
            context.fillStyle = '#0000005e';
            context.fillRect(0, 0, width, height * 0.04);
            context.fillRect(0, height * 0.96, width, height);

            // エディタの領域（縦）
            let editor_height_start = height * 0.04; // エディタの開始位置
            let editor_height_end = height * 0.96; // エディタの終了位置
            let editor_height = editor_height_end - editor_height_start; // エディタの高さ
            // console.log(`ehs = ${editor_height_start}, ehe = ${editor_height_end}, eh = ${editor_height}`);

            // 白鍵　14:40, 黒鍵　8:27　白：黒　white_keyboard_height:black_keyboard_height(x) = 14:8
            let white_keyboard_height = editor_height / 35; // 白鍵の高さ
            let white_keyboard_width = white_keyboard_height * 40 / 14; // 白鍵の幅
            let black_keyboard_height = white_keyboard_height * 8 / 14; // 黒鍵の高さ
            let black_keyboard_width = black_keyboard_height * 27 / 8; // 黒鍵の幅

            // エディタの領域（横）
            let editor_width_start = white_keyboard_width; // エディタの開始位置
            let editor_width_end = width; // エディタの終了位置
            let editor_width = editor_width_end - editor_width_start; // エディタの幅
            // console.log(`ews = ${editor_width_start}, ewe = ${editor_width_end}, ew = ${editor_width}`);

            // console.log(`(wwid, whei) = (${white_keyboard_width}, ${white_keyboard_height})`);
            // console.log(`(bkwid, bkhei) = (${black_keyboard_width}, ${black_keyboard_height})`);

            // 線の描画
            for (let i = 0; i <= 35; i++) {
                context.strokeStyle = '#828282';
                
            };
        };

        if (c == 2) {
            
        };
        
        const app = Object.assign(document.getElementById('app').style, {
            width: width + 'px',
            height: height + 'px'
        });
    });
};





window.addEventListener('resize', () => {
    resize_canvas(all_canvas);
});

window.addEventListener('DOMContentLoaded', () => {
    resize_canvas(all_canvas);
});
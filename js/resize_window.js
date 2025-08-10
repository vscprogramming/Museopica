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

        // 背景の描画(background)
        if (c == 1) {
            // 塗りつぶし
            context.fillStyle = '#333';
            context.fillRect(0, 0, width, height);

            // UI背景の描画
            //context.fillStyle = '#0000005e';
            context.fillRect(0, 0, width, height * 0.04);
            context.fillRect(0, height * 0.96, width, height);

            // エディタの領域（縦）
            let editor_height_start = height * 0.04; // エディタの開始位置
            let editor_height_end = height * 0.96; // エディタの終了位置
            let editor_height = editor_height_end - editor_height_start; // エディタの高さ

            // 鍵盤の大きさ
            let white_keyboard_height = editor_height / (35 + 9); // 白鍵の高さ（白鍵35+ドラム鍵盤9）
            let white_keyboard_width = white_keyboard_height * 7; // 白鍵の幅
            let black_keyboard_height = white_keyboard_height * 8 / 14; // 黒鍵の高さ
            let black_keyboard_width = black_keyboard_height * 8; // 黒鍵の幅

            // エディタの領域（横）
            let editor_width_start = white_keyboard_width; // エディタの開始位置
            let editor_width_end = width; // エディタの終了位置
            let editor_width = editor_width_end - editor_width_start; // エディタの幅

            let quarterbeat_width = editor_width / 64;  // 0.25拍の横幅

            // 鍵盤・線の描画

            // 通常線
            context.strokeStyle = '#828282';
            context.lineWidth = 0.25;
            context.beginPath();

            for (let i = 0; i <= 35 + 9; i++) {
                // 横線
                context.moveTo(editor_width_start, editor_height_start + i * white_keyboard_height);
                context.lineTo(editor_width_end, editor_height_start + i * white_keyboard_height);
            };

            for (let i = 1; i <= 64; i++) {
                // 縦線
                if (!(i % 4 == 0)) {
                    context.moveTo(editor_width_start + i * quarterbeat_width, editor_height_start);
                    context.lineTo(editor_width_start + i * quarterbeat_width, editor_height_end);
                };
            };

            context.stroke();

            // 縦：1拍ごと
            context.lineWidth = 0.5;
            context.beginPath();

            for (let i = 1; i <= 64; i++) {
                // 縦線
                if (i % 4 == 0) {
                    context.moveTo(editor_width_start + i * quarterbeat_width, editor_height_start);
                    context.lineTo(editor_width_start + i * quarterbeat_width, editor_height_end);
                };
            };

            context.stroke();
        };

        // 白鍵盤・UIの描画(Wkey_ui)
        if (c == 2) {

        };

        // 黒鍵盤・白鍵盤間の線の描画(Bkey)
        if (c == 3) {

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
const all_canvas = document.querySelectorAll('canvas');

function resize_canvas(all_canvas) {
    let c = 0;

    all_canvas.forEach(canvas => {
        console.log(canvas);
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

        // エディタの領域（縦）
        let editor_height_start = height * 0.04; // エディタの開始位置
        let editor_height_end = height * 0.96; // エディタの終了位置
        let editor_height = editor_height_end - editor_height_start; // エディタの高さ

        // 鍵盤の大きさ
        let white_keyboard_height = editor_height / (36 + 9); // 白鍵の高さ（白鍵36+ドラム鍵盤9）
        let white_keyboard_width = white_keyboard_height * 7; // 白鍵の幅
        let black_keyboard_height = white_keyboard_height * 8 / 14; // 黒鍵の高さ
        let black_keyboard_width = black_keyboard_height * 8; // 黒鍵の幅

        // エディタの領域（横）
        let editor_width_start = white_keyboard_width; // エディタの開始位置
        let editor_width_end = width - 1; // エディタの終了位置
        let editor_width = editor_width_end - editor_width_start; // エディタの幅

        let quarterbeat_width = editor_width / 64;  // 0.25拍の横幅

        // 背景の描画(background)
        if (c == 1) {
            // 塗りつぶし
            context.fillStyle = '#333';
            context.fillRect(0, 0, width, height);

            // UI背景の描画
            context.fillStyle = '#0000005e';
            context.fillRect(0, 0, width, height * 0.04);
            context.fillRect(0, height * 0.96, width, height);

            // 鍵盤・線の描画

            // 通常線
            context.strokeStyle = '#828282';
            context.lineWidth = 0.5;
            context.beginPath();

            for (let i = 0; i <= 36 + 9; i++) {
                // 横線
                context.moveTo(editor_width_start, editor_height_start + (i * white_keyboard_height));
                context.lineTo(editor_width_end, editor_height_start + (i * white_keyboard_height));
            };

            for (let i = 1; i <= 64; i++) {
                // 縦線
                if (!(i % 4 == 0)) {
                    context.moveTo(editor_width_start + (i * quarterbeat_width), editor_height_start);
                    context.lineTo(editor_width_start + (i * quarterbeat_width), editor_height_end);
                };
            };

            context.stroke();

            // 縦：1拍ごと
            context.lineWidth = 1;
            context.beginPath();

            for (let i = 1; i <= 64; i++) {
                if (i % 4 == 0 && !(i % 16 == 0)) {
                    context.moveTo(editor_width_start + (i * quarterbeat_width), editor_height_start);
                    context.lineTo(editor_width_start + (i * quarterbeat_width), editor_height_end);
                };
            };

            context.stroke();

            // 縦：4拍ごと
            context.lineWidth = 2;
            context.strokeStyle = '#0008ff';
            context.beginPath();

            for (let i = 1; i <= 64; i++) {
                if (i % 16 == 0) {
                    context.moveTo(editor_width_start + (i * quarterbeat_width), editor_height_start);
                    context.lineTo(editor_width_start + (i * quarterbeat_width), editor_height_end);
                };
            };

            context.stroke();

            // 横：オクターブ間（白鍵）
            context.lineWidth = 1;
            context.strokeStyle = '#cc0000';
            context.beginPath();

            for (let i = 0; i < 36; i++) {
                if (i % 7 == 1 || i % 7 == 5) {
                    context.moveTo(editor_width_start, editor_height_start + (i * white_keyboard_height));
                    context.lineTo(editor_width_end, editor_height_start + (i * white_keyboard_height));
                };
            };

            context.stroke();

            // ドラム境目
            context.lineWidth = 1;
            context.strokeStyle = '#4acc00';
            context.beginPath();
            context.moveTo(editor_width_start, editor_height_start + (36 * white_keyboard_height));
            context.lineTo(editor_width_end, editor_height_start + (36 * white_keyboard_height));
            context.stroke();
        };

        // 白鍵盤・UIの描画(Wkey_ui)
        if (c == 2) {
            // 鍵盤の描画
            for (let i = 0; i < 36 + 9; i++) {
                context.fillStyle = '#fff';
                context.fillRect(0, editor_height_start + (i * white_keyboard_height), white_keyboard_width, white_keyboard_height);
            };
        };

        // 黒鍵の描画(Bkey)
        if (c == 3) {
            context.fillStyle = '#000';
            for (let i = 1; i < 36; i++) {
                if (i % 7 == 2) {
                    // A#(ラ#)
                    context.fillRect(0, editor_height_start + (i * white_keyboard_height) - (black_keyboard_height / 2), black_keyboard_width, black_keyboard_height);
                } else if (i % 7 == 3) {
                    // G#(ソ#)
                    context.fillRect(0, editor_height_start + (i * white_keyboard_height) - (black_keyboard_height / 2), black_keyboard_width, black_keyboard_height);
                } else if (i % 7 == 4) {
                    // F#(ファ#)
                    context.fillRect(0, editor_height_start + (i * white_keyboard_height) - (black_keyboard_height / 2), black_keyboard_width, black_keyboard_height);
                } else if (i % 7 == 6) {
                    // D#(レ#)
                    context.fillRect(0, editor_height_start + (i * white_keyboard_height) - (black_keyboard_height / 2), black_keyboard_width, black_keyboard_height);
                } else if (i % 7 == 0) {
                    // C#(ド#)
                    context.fillRect(0, editor_height_start + (i * white_keyboard_height) - (black_keyboard_height / 2), black_keyboard_width, black_keyboard_height);
                };
            };
        };

        // 白鍵盤間の線・鍵盤上の文字・画像表示
        if (c == 4) {
            // 黒線
            context.strokeStyle = '#000';
            context.lineWidth = 0.5;
            context.beginPath();

            for (let i = 1; i < 36 + 9; i++) {
                context.moveTo(0, editor_height_start + (i * white_keyboard_height));
                context.lineTo(white_keyboard_width, editor_height_start + (i * white_keyboard_height));
            };

            context.stroke();
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
var instrument = [], audio_ctx = null;
var instrument_view = new Map([
    [1, 'bright_acoustic_piano'],
    [2, 'drawbar_organ'],
    [3, 'acoustic_guitar_nylon'],
    [4, 'electric_guitar_clean'],
    [5, 'electric_bass_finger'],
    [6, 'pan_flute'],
    [7, 'vibraphone'],
    [8, 'marimba'],
    [9, 'voice_oohs'],
    [10, 'lead_1_square'],
    [11, 'lead_8_bass__lead']
]);

console.log('white_key');
console.log(white_keyboards);
// console.log('black_key');
// console.log(black_keyboards);
// console.log('drum_key');
// console.log(drum_keyboards);
// console.log('instrument_view');
// console.log(instrument_view);

let bpm = 60, // テンポ
    SPB = 60 / bpm / 4, // 0.25拍の長さ（s）
    instrument_number = 1;  // 楽器番号（1~11）

// クリック時
const canvas = document.getElementById('key_ui'), context = canvas.getContext('2d');

canvas.addEventListener('click', (e) => {
    const rect_canvas = canvas.getBoundingClientRect();
    const mx = e.clientX - rect_canvas.left;
    const my = e.clientY - rect_canvas.top;

    // 白鍵再生処理
    for (let i = 0; i < white_keyboards.pitch.length; i++) {
        if (mx >= white_keyboards.x[i] && mx <= white_keyboards.x[i] + white_keyboards.w[i] &&
            my >= white_keyboards.y[i] && my <= white_keyboards.y[i] + white_keyboards.h[i]) {
            instrument[instrument_number]
                .play(white_keyboards.pitch[i], audio_ctx.currentTime, { duration: SPB, gain: 1 }); // duration：拍数（秒ms）, gain：音量

            return;
        }
    }

    // 黒鍵再生処理
    for (let i = 0; i < black_keyboards.pitch.length; i++) {
        if (mx >= black_keyboards.x[i] && mx <= black_keyboards.x[i] + black_keyboards.w[i] &&
            my >= black_keyboards.y[i] && my <= black_keyboards.y[i] + black_keyboards.h[i]) {
            instrument[instrument_number]
                .play(black_keyboards.pitch[i], audio_ctx.currentTime, { duration: SPB, gain: 1 }); // duration：拍数（秒ms）, gain：音量

            return;
        }
    }

    // ドラム
    for (let i = 0; i < drum_keyboards.pitch.length; i++) {
        if (mx >= drum_keyboards.x[i] && mx <= drum_keyboards.x[i] + drum_keyboards.w[i] &&
            my >= drum_keyboards.y[i] && my <= drum_keyboards.y[i] + drum_keyboards.h[i]) {
            // 再生処理
            alert(`ドラム鍵盤：${drum_keyboards.pitch[i]}`);

            return;
        }
    }
});

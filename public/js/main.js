// 起動処理（タイトルと楽器の読み込み処理）
const button = document.getElementById('button');

let instrument = [];
let drum = null;
let audio_ctx = null;

const instrument_view = new Map([
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
    [11, 'lead_8_bass__lead'],
]);

document.getElementById('start_display').addEventListener('click', async () => {

    document.getElementById('start_display').classList.add('clicked'); // タイトル画面フェードアウト
    if (!audio_ctx) {
        audio_ctx = new AudioContext();
        await audio_ctx.resume();
    };

    for (let c = 1; c < 12; c++) {
        instrument[c] = await Soundfont.instrument(audio_ctx, `${instrument_view.get(c)}`);
    };

    console.log(instrument);
});

let bpm = 60; // テンポ
let SPB = 60 / bpm; // 1拍の長さ（秒）
let instrument_number = 1;  // 1~11
let p = 1; //仮

button.addEventListener('click', async () => {
    let c = 60 - 0;

    for (let i = c; i <= c; i++) {

        if (p == 0) {
            instrument[instrument_number].play(i - 24, audio_ctx.currentTime, { duration: SPB, gain: 1 });
            //instrument.play(i + 12, audio_ctx.currentTime, { duration: SPB });
        } else if (p == 1) {
            instrument[instrument_number].play(i, audio_ctx.currentTime, { duration: SPB, gain: 1 });
            instrument[instrument_number].play(i + 4, audio_ctx.currentTime, { duration: SPB, gain: 1 });
            instrument[instrument_number].play(i + 7, audio_ctx.currentTime, { duration: SPB, gain: 1 });
        };
        // duration = 拍数, gain = 音量
    };
});



document.getElementById('button2').addEventListener('click', () => {
    if (instrument_number == 11) {
        instrument_number = 11;
    } else {
        instrument_number++;
    }
});

document.getElementById('button3').addEventListener('click', () => {
    if (instrument_number == 1) {
        instrument_number = 1;
    } else {
        instrument_number--;
    }
});

document.getElementById('button4').addEventListener('click', () => {
    if (p == 0) {
        p = 1;
    } else {
        p = 0;
    }
});

/*

楽器
・ピアノ
・オルガン
・ギター
・エレキギター
・ベース
・木管フルート
・ヴィブラフォン
・マリンバ
・ボイスウー

シンセ系
・リード（スクエア）
・ベースリード

*/
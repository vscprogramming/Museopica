// 起動処理（タイトルと楽器の読み込み処理）
let drum = null;

document.getElementById('start_display').addEventListener('click', async () => {
    document.getElementById('start_display').innerHTML = `
        <h1>Museopica</h1>
        <h6>読み込み中...</h6>
        <p>v0.6</p>
    `;

    if (!audio_ctx) {
        audio_ctx = new AudioContext();
        await audio_ctx.resume();
    }

    for (let c = 1; c < 12; c++) instrument[c] = await Soundfont.instrument(audio_ctx, `${instrument_view.get(c)}`);
    console.log(instrument);

    document.getElementById('start_display').innerHTML = `
        <h1>Museopica</h1>
        <h6>完了！</h6>
        <p>v0.6</p>
    `;

    console.log('instrument');
    console.log(instrument);

    setTimeout(() => {
        document.getElementById('start_display').classList.add('clicked');
    }, 2000);

    setTimeout(() => {
        document.getElementById('start_display').style.zIndex = -9999;
    }, 4000);
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
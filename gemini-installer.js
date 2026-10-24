/**
 * Chrome Built-in AI (Gemini Nano) 専用インストーラーコンポーネント
 */
(function () {
  // UI要素の作成とスタイル設定
  function createUI() {
    const container = document.createElement('div');
    container.id = 'gemini-nano-installer';
    container.style.cssText = `
      border: 1px solid #ccc;
      padding: 16px;
      margin: 16px 0;
      border-radius: 8px;
      font-family: sans-serif;
      max-width: 400px;
      background-color: #f9f9f9;
    `;

    container.innerHTML = `
      <h3 style="margin-top:0; font-size: 16px;">Gemini Nano モデルのセットアップ</h3>
      <p id="gemini-status-text" style="font-size: 14px; color: #555;">
        モデルの利用可能性を確認中...
      </p>
      <progress id="gemini-progress-bar" value="0" max="100" style="width: 100%; display: none;"></progress>
      <div style="margin-top: 12px;">
        <button id="gemini-install-btn" style="padding: 8px 16px; cursor: pointer;" disabled>
          ダウンロード開始
        </button>
      </div>
    `;

    return container;
  }

  async function initInstaller() {
    // 挿入先要素（なければ body の末尾）
    const targetElement = document.getElementById('gemini-installer-root') || document.body;
    const ui = createUI();
    targetElement.appendChild(ui);

    const statusText = document.getElementById('gemini-status-text');
    const progressBar = document.getElementById('gemini-progress-bar');
    const installBtn = document.getElementById('gemini-install-btn');

    // 1. ブラウザサポートチェック
    if (!LanguageModel) {
      statusText.innerText = 'お使いのブラウザは Chrome Built-in AI に対応していないか、フラグ設定が無効です。';
      return;
    }

    try {
      // 2. 利用可能性の事前確認 (capabilities / availability)
      const available = await LanguageModel.availability();

      if (available === 'available') {
        statusText.innerText = '✅ Gemini Nano は既にインストールされており、すぐに利用可能です。';
        installBtn.innerText = '準備完了';
        installBtn.disabled = true;
      } else if (available === 'downloadable') {
        statusText.innerText = '💡 モデルのダウンロードが必要です。下のボタンを押して準備を開始してください。';
        installBtn.disabled = false;
        
        // ボタン押下でダウンロード（create）を実行
        installBtn.addEventListener('click', async () => {
          installBtn.disabled = true;
          statusText.innerText = 'ダウンロード中...（時間がかかる場合があります）';
          progressBar.style.display = 'block';

          try {
            // monitor を使ってダウンロード進捗を監視しながらインストール実行
            const session = await LanguageModel.create({
              monitor(m) {
                m.addEventListener('downloadprogress', (e) => {
                  const percent = Math.round((e.loaded / e.total) * 100);
                  progressBar.value = percent;
                  statusText.innerText = `ダウンロード中: ${percent}% (${Math.round(e.loaded / 1024 / 1024)}MB / ${Math.round(e.total / 1024 / 1024)}MB)`;
                });
              }
            });

            // セッション作成完了 ＝ インストール完了
            statusText.innerText = '🎉 インストールが完了しました！これでAI機能を利用できます。';
            progressBar.value = 100;
            
            // 不要になったテストセッションの解放
            if (session && typeof session.destroy === 'function') {
              session.destroy();
            }
          } catch (err) {
            console.error(err);
            statusText.innerText = `❌ ダウンロードエラー: ${err.message}`;
            installBtn.disabled = false;
          }
        });

      } else {
        statusText.innerText = '⚠️ この端末・環境では Gemini Nano を利用できません。';
      }
    } catch (e) {
      console.error(e);
      statusText.innerText = 'ステータス確認中にエラーが発生しました。';
    }
  }

  // DOMContentLoaded に合わせて初期化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initInstaller);
  } else {
    initInstaller();
  }
})();
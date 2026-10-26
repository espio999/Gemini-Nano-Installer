/**
 * Chrome Built-in AI (Gemini Nano) 専用インストーラーロジック (日英多言語対応版)
 */
(function () {
  // 多言語メッセージ定義テーブル
  const i18nDict = {
    ja: {
      docTitle: 'Gemini Nano インストールページ',
      pageTitle: 'アプリ利用前準備',
      pageDesc: 'メイン機能を利用する前に、以下のコンポーネントからローカルAIモデルをインストールしてください。',
      cardTitle: 'Gemini Nano モデルのセットアップ',
      checking: 'モデルの利用可能性を確認中...',
      noUI: '必要なUI要素が見つかりません。',
      notAvailable: 'お使いのブラウザは Chrome Built-in AI に対応していないか、フラグ設定が無効です。',
      available: '✅ Gemini Nano は既にインストールされており、すぐに利用可能です。',
      ready: '準備完了',
      downloadable: '💡 モデルのダウンロードが必要です。下のボタンを押して準備を開始してください。',
      startDownload: 'ダウンロード開始',
      downloading: 'ダウンロード中...（時間がかかる場合があります）',
      progress: 'ダウンロード中:',
      installed: '🎉 インストールが完了しました！これでAI機能を利用できます。',
      downloadError: '❌ ダウンロードエラー:',
      notSupported: '⚠️ この端末・環境では Gemini Nano を利用できません。',
      statusError: 'ステータス確認中にエラーが発生しました。'
    },
    en: {
      docTitle: 'Gemini Nano Setup Page',
      pageTitle: 'Prerequisites',
      pageDesc: 'Please setup the local AI model from the component below before using the main features.',
      cardTitle: 'Gemini Nano Model Setup',
      checking: 'Checking model availability...',
      noUI: 'Required UI elements were not found.',
      notAvailable: 'Your browser does not support Chrome Built-in AI, or the required flags are disabled.',
      available: '✅ Gemini Nano is already installed and ready to use.',
      ready: 'Ready',
      downloadable: '💡 A model download is required. Click the button below to start setup.',
      startDownload: 'Start Download',
      downloading: 'Downloading... (This may take a few minutes)',
      progress: 'Downloading:',
      installed: '🎉 Installation complete! You can now use the AI features.',
      downloadError: '❌ Download error:',
      notSupported: '⚠️ Gemini Nano is not supported on this device or environment.',
      statusError: 'An error occurred while checking status.'
    }
  };

  // デフォルト言語の設定 (ブラウザ言語が 英語系なら 'en'、それ以外は 'ja')
  let currentLang = navigator.language.startsWith('en') ? 'en' : 'ja';

  // 状態保持用のオブジェクト
  const state = {
    availabilityStatus: null, // 'available' | 'downloadable' | 'notSupported' | 'notAvailable' | 'error'
    isDownloading: false,
    downloadPercent: 0,
    downloadErrorMessage: '',
    isInstalled: false
  };

  function getMsg(key) {
    return i18nDict[currentLang][key] || key;
  }

  // HTML内の data-i18n 属性を持つ要素のテキストを一括更新
  function updateStaticTexts() {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (i18nDict[currentLang][key]) {
        if (el.tagName === 'TITLE') {
          document.title = i18nDict[currentLang][key];
        } else {
          el.innerText = i18nDict[currentLang][key];
        }
      }
    });
  }

  // 現在の状態（state）と選択言語に応じてUIを再描画する関数
  function renderUI() {
    const statusText = document.getElementById('gemini-status-text');
    const installBtn = document.getElementById('gemini-install-btn');

    updateStaticTexts();

    // 言語切り替えボタンのアクティブ状態の更新
    document.querySelectorAll('.lang-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.id === `lang-btn-${currentLang}`);
    });

    if (!statusText || !installBtn) return;

    // インストール完了時
    if (state.isInstalled) {
      statusText.innerText = getMsg('installed');
      installBtn.innerText = getMsg('ready');
      installBtn.disabled = true;
      return;
    }

    // ダウンロードエラー発生時
    if (state.downloadErrorMessage) {
      statusText.innerText = `${getMsg('downloadError')} ${state.downloadErrorMessage}`;
      installBtn.innerText = getMsg('startDownload');
      installBtn.disabled = false;
      return;
    }

    // ダウンロード実行中
    if (state.isDownloading) {
      statusText.innerText = `${getMsg('progress')} ${state.downloadPercent}%`;
      installBtn.disabled = true;
      return;
    }

    // 各ステータスごとの初期表示処理
    switch (state.availabilityStatus) {
      case 'available':
        statusText.innerText = getMsg('available');
        installBtn.innerText = getMsg('ready');
        installBtn.disabled = true;
        break;
      case 'downloadable':
        statusText.innerText = getMsg('downloadable');
        installBtn.innerText = getMsg('startDownload');
        installBtn.disabled = false;
        break;
      case 'notAvailable':
        statusText.innerText = getMsg('notAvailable');
        installBtn.disabled = true;
        break;
      case 'notSupported':
        statusText.innerText = getMsg('notSupported');
        installBtn.disabled = true;
        break;
      case 'error':
        statusText.innerText = getMsg('statusError');
        installBtn.disabled = true;
        break;
      default:
        statusText.innerText = getMsg('checking');
        installBtn.innerText = getMsg('startDownload');
        installBtn.disabled = true;
        break;
    }
  }

  async function initInstaller() {
    const statusText = document.getElementById('gemini-status-text');
    const progressBar = document.getElementById('gemini-progress-bar');
    const installBtn = document.getElementById('gemini-install-btn');

    if (!statusText || !progressBar || !installBtn) {
      console.error('UI elements not found.');
      return;
    }

    // 言語切り替えボタンのイベントリスナー設定
    document.getElementById('lang-btn-ja')?.addEventListener('click', () => {
      currentLang = 'ja';
      renderUI();
    });
    document.getElementById('lang-btn-en')?.addEventListener('click', () => {
      currentLang = 'en';
      renderUI();
    });

    // 初期テキストの設定
    renderUI();

    // 1. ブラウザサポートチェック
    if (!window.LanguageModel) {
      state.availabilityStatus = 'notAvailable';
      renderUI();
      return;
    }

    try {
      // 2. 利用可能性の事前確認
      const available = await LanguageModel.availability();

      if (available === 'available') {
        state.availabilityStatus = 'available';
        renderUI();
      } else if (available === 'downloadable') {
        state.availabilityStatus = 'downloadable';
        renderUI();

        // ボタン押下でダウンロード（create）を実行
        installBtn.addEventListener('click', async () => {
          state.isDownloading = true;
          state.downloadErrorMessage = '';
          progressBar.style.display = 'block';
          renderUI();

          try {
            const session = await LanguageModel.create({
              monitor(m) {
                m.addEventListener('downloadprogress', (e) => {
                  const percent = Math.round((e.loaded / e.total) * 100);
                  state.downloadPercent = percent;
                  progressBar.value = percent;
                  renderUI();
                });
              }
            });

            // セッション作成完了 ＝ インストール完了
            state.isDownloading = false;
            state.isInstalled = true;
            progressBar.value = 100;
            renderUI();

            // 不要になったテストセッションの解放
            if (session && typeof session.destroy === 'function') {
              session.destroy();
            }
          } catch (err) {
            console.error(err);
            state.isDownloading = false;
            state.downloadErrorMessage = err.message || '';
            renderUI();
          }
        });
      } else {
        state.availabilityStatus = 'notSupported';
        renderUI();
      }
    } catch (e) {
      console.error(e);
      state.availabilityStatus = 'error';
      renderUI();
    }
  }

  // DOMContentLoaded に合わせて初期化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initInstaller);
  } else {
    initInstaller();
  }
})();
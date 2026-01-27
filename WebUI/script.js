(function($) {
    $(function () {

        /* ------------------------------
           ▼ ヘッダー高さ → CSS変数へ反映
        ------------------------------ */
        function updateHeaderSize() {
            const h = $('#global-head').outerHeight();  // ヘッダーの実高さを取得
            document.documentElement.style.setProperty('--header-h', h + 'px');
        }

        updateHeaderSize();
        $(window).on('resize', updateHeaderSize);

        /* ------------------------------
           ▼ 既存メニュー機能
        ------------------------------ */
        $('.sub-menu.is-active .sub-menu-nav').show();

        $('.sub-menu-head').on('click', function(){
            var $subNav = $(this).next('.sub-menu-nav');
            if ($subNav.is(':visible')) {
                $subNav.velocity('slideUp', {duration: 200});
                $(this).parent('li').removeClass('is-active');
            } else {
                $subNav.velocity('slideDown', {duration: 200});
                $(this).parent('li').addClass('is-active');
            }
            return false;
        });

        $('#nav-toggle').on('click', function() {
            $('body').toggleClass('close');
        });

        //$('.scroll').perfectScrollbar();

        /* ------------------------------
           ▼ ポップアップ関連
        ------------------------------ */
        // インフォメーションボタン
        $('#popupBtn').on('click', function() {
            $('#myPopup').fadeIn().addClass('show');
        });

        // ポップアップ閉じる（背景クリックと閉じボタン）
        $('#myPopup').on('click', function(e) {
            if (e.target === this) {
                $(this).fadeOut().removeClass('show');
            }
        });
        $('#close').on('click', function() {
            $('#myPopup').fadeOut().removeClass('show');
        });
        $("#openVpnUserPopup").on("click", function () {
  $("#vpnUserPopup").fadeIn().addClass("show");
});

// 閉じるボタン
$("#closeVpnUserPopup").on("click", function () {
  $("#vpnUserPopup").fadeOut().removeClass("show");
});


        
        
    });
})(jQuery);

$(document).ready(function () {

    /* =========================
       内部状態
    ========================= */
    let vpnEnabledApplied = false; // VPN の確定状態（内部）
    let pskApplied = false;        // PSK 適用済み
    let pendingEnableConfirm = false;  // OFF→ON の確認待ち
    let pendingPskApplied = false;     // 確認待ちの PSK 適用フラグ

    /* =========================
       UI 状態更新
    ========================= */
    function updateVpnUiState() {
      	const vpnEnabled = vpnEnabledApplied;
        
        // 追加：VPN ON ＋ PSK適用済み
        $("#openVpnUserPopup").prop("disabled", !(vpnEnabled && pskApplied));

        // 削除：VPN ON のときだけ
        $(".delete-btn").prop("disabled", !vpnEnabled);

        // 見た目
        $("#openVpnUserPopup").css("opacity", vpnEnabled && pskApplied ? 1 : 0.5);
        $(".delete-btn").css("opacity", vpnEnabled ? 1 : 0.5);
    }

     /* =========================
   VPN ON/OFF（ON時のみ確認）
========================= */
$("#vpnEnable").on("change", function () {
   });

$("#popupYes").on("click", function () {
    // OFF→ON の確認が OK されたときだけ確定
    if (pendingEnableConfirm) {
        vpnEnabledApplied = true;
        pskApplied = pendingPskApplied || true;
    }
    pendingEnableConfirm = false;
    pendingPskApplied = false;

    updateVpnUiState();
    $("#confirmPopup").fadeOut().removeClass("show");
});

$("#popupNo").on("click", function () {
    // 内部状態は変更しない（UI は確定済み状態へ戻す）
    $("#vpnEnable").prop("checked", vpnEnabledApplied);

    pendingEnableConfirm = false;
    pendingPskApplied = false;

    $("#confirmPopup").fadeOut().removeClass("show");
});

    /* =========================
       PSK 適用
    ========================= */
    $("#applyPsk").on("click", function () {
    const psk = $("#vpnPsk").val().trim();
    const uiChecked = $("#vpnEnable").is(":checked");

    if (!psk) {
        pskApplied = false;
        updateVpnUiState();
        return;
    }

    // UI 上の希望状態 (uiChecked) を適用する。確認は「OFF→ON」のときだけ出す。
    if (uiChecked && !vpnEnabledApplied) {
        pendingEnableConfirm = true;
        pendingPskApplied = true;
        $("#confirmPopup").fadeIn().addClass("show");
        return;
    }

    // それ以外は即時確定
    pendingEnableConfirm = false;
    pendingPskApplied = false;

    vpnEnabledApplied = uiChecked; // ON のまま / OFF へ / OFF のまま
    pskApplied = true;             // PSK は適用された
    updateVpnUiState();
});



    /* =========================
       ユーザー削除（委譲）
    ========================= */
    $(document).on("click", ".delete-btn", function () {
        if ($(this).prop("disabled")) return;
        $(this).closest("tr").remove();
    });

    /* =========================
       ユーザー追加
    ========================= */
    $(document).on("click", "#addVpnUser", function () {

        if ($(this).prop("disabled")) return;

        const user = $("#vpnUser").val().trim();
        const pass = $("#vpnPass").val().trim();

        // ここだけエラーメッセージを出す（要件どおり）
        if (!user || !pass) {
            $("#vpnErrorMsg").text("ユーザー名とパスワードを入力してください");
            return;
        }

        if (!/^[a-zA-Z0-9._-]+$/.test(user)) {
            $("#vpnErrorMsg").text("ユーザー名に使用できない文字が含まれています");
            return;
        }

        const isDuplicate = $("#vpnUserTable tbody tr")
            .not("#vpnInputRow")
            .toArray()
            .some(row =>
                $(row).find("td").eq(0).text().toLowerCase() === user.toLowerCase()
            );

        if (isDuplicate) {
            $("#vpnErrorMsg").text("同じユーザー名が既に存在します");
            return;
        }

        $("#vpnErrorMsg").text("");

        const newRow = `
            <tr>
                <td>${user}</td>
                <td>******</td>
                <td>
                    <button class="table delete-btn">削除</button>
                </td>
            </tr>
        `;

        $("#vpnUserTable tbody").append(newRow);

        $("#vpnUser").val("");
        $("#vpnPass").val("");

        updateVpnUiState();
	$("#FinishPopup").fadeIn().addClass("show");
        $("#vpnUserPopup").fadeOut().removeClass("show");
    });

    /* =========================
       初期状態
    ========================= */
    $(document).on("click", "#cancelVpnUser", function () {
  $("#vpnUser").val("");
  $("#vpnPass").val("");
  $("#vpnErrorMsg").text("");
  $("#vpnUserPopup").fadeOut().removeClass("show");
    });

    updateVpnUiState();
        //ギブアップ
    let enableGiveupPopup = true;
    if ($('#FinishPopup').hasClass('show')) {
        enableGiveupPopup = false;
    }
    let giveupClosable = false;
    function startGiveupPopupTimer() {
    const startTime = Date.now(); // ページ表示時刻を記録

    function checkElapsed() {
        const elapsed = Date.now() - startTime;

        // 5分（300000ms）以上経過していたら表示
        if (elapsed >=10*60*1000) {
            if (!enableGiveupPopup) return;
            // GiveupPopup 初回表示
            $('#GiveupPopup').fadeIn().addClass('show');

            // 初回は3秒閉じられない
            giveupClosable = false;
            setTimeout(function () {
                giveupClosable = true;
            }, 3 * 1000);

            // 再表示ボタン化
            $('#dummyBtn')
                .addClass('giveup-btn')
                .attr('title', '結果を再表示');

        } else {
            // まだ5分経っていなければ再チェック
            setTimeout(checkElapsed, 1000);
        }
    }

    // チェック開始
    checkElapsed();
    }
    function showGiveupPopupReplay() {
        $('#GiveupPopup').fadeIn().addClass('show');
        giveupClosable = true; // 再表示は即閉じ可能
    }
    $('#GiveupPopup').on('click', function (e) {
        if (e.target === this && giveupClosable) {
        $(this).fadeOut().removeClass('show');
        }
    });
    $(document).on('click', '.giveup-btn', function () {
    showGiveupPopupReplay();
    });
    startGiveupPopupTimer();
    $(document).on("click", ".delete-btn", function () {
    $(this).closest("tr").remove();
    });
});

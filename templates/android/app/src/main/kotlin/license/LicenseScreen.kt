package com.harmonic.insight.__APPNAME__.license

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.harmonic.insight.__APPNAME__.R
import com.harmonic.insight.__APPNAME__.ui.theme.InsightPlanEnt
import com.harmonic.insight.__APPNAME__.ui.theme.InsightPlanPro
import com.harmonic.insight.__APPNAME__.ui.theme.InsightPlanStd
import com.harmonic.insight.__APPNAME__.ui.theme.InsightPlanTrial
import com.harmonic.insight.__APPNAME__.ui.theme.InsightSuccess
import kotlinx.coroutines.launch

// ============================================================
// Insight ライセンス画面 (Insight Slides 形式)
//
// 【このファイルについて】
// insight-common/templates/android/ からコピーして使用。
// __APPNAME__ を実際のパッケージ名に置換してください。
// __app_display_name__ をアプリの表示名に置換してください。
//
// CLAUDE.md § 8「ライセンス画面（必須）」に準拠。
// ┌────────────────────────────────────┐
// │      Insight Product Name          │  ← Gold色、中央配置
// │         現在のプラン                │
// │            STD                     │
// │     有効期限: 2027年01月31日        │
// │  ┌──────────────────────────────┐  │
// │  │ 機能一覧                      │  │
// │  │ • 機能1          ○利用可能   │  │
// │  └──────────────────────────────┘  │
// │  ┌──────────────────────────────┐  │
// │  │ ライセンス認証                 │  │
// │  │ メールアドレス: [          ]  │  │
// │  │ ライセンスキー: [          ]  │  │
// │  │ [アクティベート] [クリア]     │  │
// │  └──────────────────────────────┘  │
// └────────────────────────────────────┘
// ============================================================

@Composable
fun LicenseScreen(
    licenseManager: LicenseManager,
    appDisplayName: String = "__app_display_name__",
    features: List<FeatureItem> = emptyList(),
    onBack: () -> Unit = {},
) {
    var emailInput by remember { mutableStateOf(licenseManager.email ?: "") }
    var keyInput by remember { mutableStateOf("") }
    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()
    var currentPlan by remember { mutableStateOf(licenseManager.currentPlan) }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            // --- アプリ名 (Gold) ---
            Text(
                text = appDisplayName,
                style = MaterialTheme.typography.headlineMedium,
                color = MaterialTheme.colorScheme.primary,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center,
            )

            Spacer(modifier = Modifier.height(32.dp))

            // --- 現在のプラン ---
            Text(
                text = stringResource(R.string.license_current_plan),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )

            Spacer(modifier = Modifier.height(8.dp))

            val planDisplay = currentPlan?.displayName ?: "---"
            val planColor = when (currentPlan) {
                PlanCode.TRIAL -> InsightPlanTrial
                PlanCode.STD -> InsightPlanStd
                PlanCode.PRO -> InsightPlanPro
                PlanCode.ENT -> InsightPlanEnt
                null -> MaterialTheme.colorScheme.onSurfaceVariant
            }

            Text(
                text = planDisplay,
                style = MaterialTheme.typography.displaySmall,
                color = planColor,
                fontWeight = FontWeight.Bold,
            )

            Spacer(modifier = Modifier.height(8.dp))

            // --- 有効期限 ---
            Text(
                text = "${stringResource(R.string.license_expiry)}: ${licenseManager.formattedExpiry()}",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )

            Spacer(modifier = Modifier.height(24.dp))

            // --- 機能一覧カード ---
            if (features.isNotEmpty()) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surface,
                    ),
                    shape = RoundedCornerShape(12.dp),
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = stringResource(R.string.license_features),
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        features.forEach { feature ->
                            val isAvailable = licenseManager.canUseFeature(
                                feature.key,
                                feature.requiredPlans,
                            )

                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 4.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Text(
                                    text = feature.displayName,
                                    style = MaterialTheme.typography.bodyMedium,
                                )
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Box(
                                        modifier = Modifier
                                            .size(8.dp)
                                            .clip(CircleShape)
                                            .background(
                                                if (isAvailable) InsightSuccess
                                                else MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.3f)
                                            ),
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = if (isAvailable) {
                                            stringResource(R.string.license_feature_available)
                                        } else {
                                            stringResource(R.string.license_feature_unavailable)
                                        },
                                        style = MaterialTheme.typography.bodySmall,
                                        color = if (isAvailable) InsightSuccess
                                        else MaterialTheme.colorScheme.onSurfaceVariant,
                                    )
                                }
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))
            }

            // --- ライセンス認証カード ---
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surface,
                ),
                shape = RoundedCornerShape(12.dp),
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = stringResource(R.string.license_title),
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    OutlinedTextField(
                        value = emailInput,
                        onValueChange = { emailInput = it },
                        label = { Text(stringResource(R.string.license_email_hint)) },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    OutlinedTextField(
                        value = keyInput,
                        onValueChange = { keyInput = it },
                        label = { Text(stringResource(R.string.license_key_hint)) },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        Button(
                            onClick = {
                                val result = licenseManager.activate(emailInput, keyInput)
                                result.fold(
                                    onSuccess = { planName ->
                                        currentPlan = licenseManager.currentPlan
                                        scope.launch {
                                            snackbarHostState.showSnackbar(
                                                stringResource(R.string.license_activated)
                                            )
                                        }
                                    },
                                    onFailure = { error ->
                                        scope.launch {
                                            snackbarHostState.showSnackbar(
                                                error.message ?: "Error"
                                            )
                                        }
                                    },
                                )
                            },
                            modifier = Modifier.weight(1f),
                        ) {
                            Text(stringResource(R.string.license_activate))
                        }

                        OutlinedButton(
                            onClick = {
                                licenseManager.deactivate()
                                currentPlan = null
                                emailInput = ""
                                keyInput = ""
                            },
                            modifier = Modifier.weight(1f),
                        ) {
                            Text(stringResource(R.string.license_clear))
                        }
                    }
                }
            }
        }
    }
}

/**
 * 機能一覧に表示する項目。
 *
 * @param key 機能キー (LicenseManager.canUseFeature で使用)
 * @param displayName 表示名
 * @param requiredPlans この機能を利用可能なプラン → プランのセット のマップ
 */
data class FeatureItem(
    val key: String,
    val displayName: String,
    val requiredPlans: Map<String, Set<PlanCode>>,
)

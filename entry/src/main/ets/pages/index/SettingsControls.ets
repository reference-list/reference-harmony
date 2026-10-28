import type { AppThemeTokens } from '../../common/appTheme';

// 新增设置项沿用原设置页的胶囊操作与轻量输入框，尺寸均相对字号。
@Component
export struct SettingsActionButton {
  @Prop theme: AppThemeTokens;
  @Prop fontSize: number;
  @Prop label: string;
  @Prop primary: boolean = false;
  @Prop inline: boolean = false;
  @Prop danger: boolean = false;
  @Prop disabled: boolean = false;
  onAction?: () => void;

  build() {
    Button({ type: ButtonType.Normal }) {
      Text(this.label)
        .fontSize(this.fontSize * (this.inline ? 0.8 : 0.85))
        .fontColor(this.danger ? this.theme.dangerTextColor : this.primary ?
          this.theme.chipSelectedTextColor : this.inline ? this.theme.accentColor : this.theme.chipTextColor);
    }
    .height(this.fontSize * 1.8)
    .padding({ left: this.fontSize * (this.inline ? 0.5 : 0.6), right: this.fontSize * (this.inline ? 0.5 : 0.6) })
    .backgroundColor(this.inline ? Color.Transparent : this.primary ?
      this.theme.chipSelectedBackgroundColor : this.theme.chipBackgroundColor)
    .borderRadius(this.fontSize * 66)
    .enabled(!this.disabled)
    .opacity(this.disabled ? 0.5 : 1)
    .accessibilityText(this.label)
    .onClick(() => { if (!this.disabled) this.onAction?.(); });
  }
}

@Component
export struct SettingsField {
  @Prop theme: AppThemeTokens;
  @Prop fontSize: number;
  @Prop label: string;
  @Prop placeholder: string = '';
  @Prop disabled: boolean = false;
  @Prop maxLength: number = 2048;
  @Link value: string;

  build() {
    Column({ space: this.fontSize * 0.4 }) {
      Text(this.label).fontSize(this.fontSize * 0.85).fontColor(this.theme.mutedTextColor);
      TextInput({ text: this.value, placeholder: this.placeholder })
        .width('100%')
        .fontSize(this.fontSize * 0.8)
        .placeholderFont({ size: this.fontSize * 0.8 })
        .fontColor(this.theme.titleColor)
        .placeholderColor(this.theme.mutedTextColor)
        .backgroundColor(this.theme.pageBackgroundColor)
        .border({ width: this.fontSize * 0.07, color: this.theme.borderColor })
        .borderRadius(this.fontSize * 0.5)
        .padding({ left: this.fontSize * 0.6, right: this.fontSize * 0.6, top: this.fontSize * 0.4, bottom: this.fontSize * 0.4 })
        .enableAutoFill(false)
        .maxLength(this.maxLength)
        .enabled(!this.disabled)
        .opacity(this.disabled ? 0.65 : 1)
        .accessibilityText(this.label)
        .onChange((value: string): void => { this.value = value; });
    }
    .width('100%')
    .alignItems(HorizontalAlign.Start);
  }
}

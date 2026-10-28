import { SettingsActionButton, SettingsField } from './SettingsControls';
import type { AppThemeTokens } from '../../common/appTheme';
import type { CatalogSource, CatalogSourceStatus } from '../../common/catalogSourceModels';
import { DEFAULT_CATALOG_SOURCE_ID } from '../../common/catalogSourceModels';

/** 每行通过显式属性接收最新状态，复用同一来源标识时也能刷新文案和操作。 */
@Component
struct CatalogSourceRow {
  @Prop theme: AppThemeTokens;
  @Prop fontSize: number;
  @Prop lang: 'zh' | 'en';
  @Prop source: CatalogSource;
  @Prop statusText: string;
  @Prop error: boolean = false;
  @Prop saving: boolean;
  onRemove?: (id: string) => void;
  onRestore?: () => void;

  private t(zh: string, en: string): string {
    return this.lang === 'en' ? en : zh;
  }

  build() {
    Row({ space: this.fontSize * 0.5 }) {
      Column({ space: this.fontSize * 0.2 }) {
        Text(this.source.name).fontSize(this.fontSize * 0.9).fontColor(this.theme.titleColor);
        Text(this.source.url).width('100%').fontSize(this.fontSize * 0.75).fontColor(this.theme.accentColor)
          .wordBreak(WordBreak.BREAK_ALL).copyOption(CopyOptions.LocalDevice);
        Text(this.statusText).width('100%').fontSize(this.fontSize * 0.8)
          .fontColor(this.error ? this.theme.dangerTextColor : this.theme.mutedTextColor)
          .wordBreak(WordBreak.BREAK_ALL).copyOption(CopyOptions.LocalDevice);
      }.layoutWeight(1).alignItems(HorizontalAlign.Start);
      if (this.source.enabled) {
        SettingsActionButton({ theme: this.theme, fontSize: this.fontSize, label: this.t('删除', 'Remove'), inline: true, danger: true,
          disabled: this.saving, onAction: (): void => { this.onRemove?.(this.source.id); } });
      } else if (this.source.id === DEFAULT_CATALOG_SOURCE_ID) {
        SettingsActionButton({ theme: this.theme, fontSize: this.fontSize, label: this.t('恢复', 'Restore'), primary: true,
          disabled: this.saving, onAction: this.onRestore });
      }
    }
    .width('100%')
    .alignItems(VerticalAlign.Center)
    .padding({ top: this.fontSize * 0.3, bottom: this.fontSize * 0.3 });
  }
}

@Component
export struct CatalogSourcesPanel {
  @Prop theme: AppThemeTokens;
  @Prop fontSize: number;
  @Prop lang: 'zh' | 'en';
  @Prop sources: Array<CatalogSource> = [];
  @Prop statuses: Array<CatalogSourceStatus> = [];
  @Link urlInput: string;
  @Prop message: string = '';
  @Prop saving: boolean = false;
  onSave?: () => void;
  onRemove?: (id: string) => void;
  onRestore?: () => void;
  onRefresh?: () => void;

  private t(zh: string, en: string): string {
    return this.lang === 'en' ? en : zh;
  }

  private statusText(source: CatalogSource): string {
    if (!source.enabled) return this.t('已移除 · 恢复后重新显示清单', 'Removed · Restore to show lists again');
    const status = this.statuses.find((item: CatalogSourceStatus): boolean => item.sourceId === source.id);
    if (!status) return this.t('等待同步，可点击刷新', 'Ready to sync. Tap Refresh.');
    if (status.loading) return this.t('正在同步清单…', 'Syncing lists…');
    if (status.error) return status.error;
    return this.t(`${status.count} 个清单`, `${status.count} lists`);
  }

  build() {
    Column({ space: 0 }) {
      Row({ space: this.fontSize * 0.5 }) {
        Column({ space: this.fontSize * 0.2 }) {
          Text(this.t('清单源', 'List sources')).fontSize(this.fontSize * 0.95).fontColor(this.theme.mutedTextColor);
          Text(this.t('添加目录地址即可浏览清单，移除后保留收藏与阅读记录。',
            'Add a catalog URL to browse its lists. Favorites and reading history are kept when removed.'))
            .fontSize(this.fontSize * 0.75).fontColor(this.theme.mutedTextColor).opacity(0.7);
        }.layoutWeight(1).alignItems(HorizontalAlign.Start);
        SettingsActionButton({ theme: this.theme, fontSize: this.fontSize, label: this.t('刷新', 'Refresh'),
          disabled: this.saving || this.statuses.some((status: CatalogSourceStatus): boolean => status.loading), onAction: this.onRefresh });
      }.width('100%').alignItems(VerticalAlign.Center)
        .padding({ left: this.fontSize * 0.9, right: this.fontSize * 0.9, top: this.fontSize * 0.7, bottom: this.fontSize * 0.5 });
      Column({ space: this.fontSize * 0.3 }) {
        ForEach(this.sources, (_source: CatalogSource, index: number) => {
          CatalogSourceRow({ theme: this.theme, fontSize: this.fontSize, lang: this.lang,
            source: this.sources[index], statusText: this.statusText(this.sources[index]), saving: this.saving,
            error: (this.statuses.find((status: CatalogSourceStatus): boolean => status.sourceId === this.sources[index].id)?.error.length ?? 0) > 0,
            onRemove: this.onRemove, onRestore: this.onRestore,
          });
        }, (source: CatalogSource): string => source.id);
      }.width('100%').alignItems(HorizontalAlign.Start)
        .padding({ left: this.fontSize * 0.9, right: this.fontSize * 0.9, bottom: this.fontSize * 0.5 });
      Divider().color(this.theme.borderColor).strokeWidth(this.fontSize * 0.07);
      Column({ space: this.fontSize * 0.5 }) {
        Text(this.t('添加清单源', 'Add source'))
          .fontSize(this.fontSize * 0.85).fontColor(this.theme.mutedTextColor);
        SettingsField({ theme: this.theme, fontSize: this.fontSize, label: this.t('目录地址', 'Catalog URL'), value: this.urlInput,
          placeholder: 'https://example.com/catalog.json', disabled: this.saving });
        Text(this.t('目录中应包含各清单文件的链接。', 'The catalog should contain links to the list files.'))
          .fontSize(this.fontSize * 0.75).fontColor(this.theme.mutedTextColor).opacity(0.7);
        if (this.message) {
          Text(this.message).width('100%').fontSize(this.fontSize * 0.85).fontColor(this.theme.dangerTextColor)
            .wordBreak(WordBreak.BREAK_ALL).copyOption(CopyOptions.LocalDevice);
        }
        Row({ space: this.fontSize * 0.6 }) {
          SettingsActionButton({ theme: this.theme, fontSize: this.fontSize, primary: true,
            label: this.saving ? this.t('保存中…', 'Saving…') : this.t('添加', 'Add'),
            disabled: this.saving || !this.urlInput.trim(), onAction: this.onSave });
        }.width('100%').justifyContent(FlexAlign.End);
      }.width('100%').alignItems(HorizontalAlign.Start)
        .padding({ left: this.fontSize * 0.9, right: this.fontSize * 0.9, top: this.fontSize * 0.5, bottom: this.fontSize * 0.7 });
    }
    .width('100%')
    .backgroundColor(this.theme.surfaceBackgroundColor)
    .borderRadius(this.fontSize * 0.8)
    .border({ width: this.fontSize * 0.07, color: this.theme.borderColor });
  }
}

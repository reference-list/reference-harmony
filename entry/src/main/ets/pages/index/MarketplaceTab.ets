import type { AppThemeTokens } from '../../common/appTheme';
import type { CatalogSource } from '../../common/catalogSourceModels';
import type { MarketplaceCatalog } from '../../common/marketplaceModels';
import { marketplaceSource, searchMarketplace } from '../../common/marketplaceModels';
import { openExternalLink } from '../../common/openExternalLink';
import { SettingsActionButton } from './SettingsControls';
import { lengthToNumber } from './utils';

@Component
struct MarketplaceCard {
  @Prop theme: AppThemeTokens;
  @Prop fontSize: number;
  @Prop lang: 'zh' | 'en';
  @Prop item: MarketplaceCatalog;
  @Prop added: boolean;
  @Prop removed: boolean;
  @Prop saving: boolean;
  @Prop adding: boolean;
  onAdd?: (item: MarketplaceCatalog) => void;

  private t(zh: string, en: string): string { return this.lang === 'en' ? en : zh; }

  build() {
    Column({ space: this.fontSize * 0.5 }) {
      Row({ space: this.fontSize * 0.6 }) {
        Text(this.lang === 'en' && this.item.nameEn ? this.item.nameEn : this.item.name)
          .fontSize(this.fontSize).fontWeight(FontWeight.Medium).fontColor(this.theme.titleColor)
          .layoutWeight(1);
        SettingsActionButton({ theme: this.theme, fontSize: this.fontSize,
          label: this.adding ? this.t('添加中…', 'Adding…') : this.added ? this.t('已添加', 'Added') :
            this.removed ? this.t('恢复', 'Restore') : this.t('添加', 'Add'),
          primary: !this.added, disabled: this.saving || this.added,
          onAction: (): void => { this.onAdd?.(this.item); },
        });
      }.width('100%').alignItems(VerticalAlign.Center);
      Text(this.lang === 'en' && this.item.descriptionEn ? this.item.descriptionEn : this.item.description)
        .fontSize(this.fontSize * 0.85).fontColor(this.theme.mutedTextColor);
      if (this.item.tags.length > 0) {
        Text(this.item.tags.join(' · ')).fontSize(this.fontSize * 0.75).fontColor(this.theme.chipTextColor);
      }
      Text(this.item.catalogUrl).width('100%').fontSize(this.fontSize * 0.75)
        .fontColor(this.theme.accentColor).wordBreak(WordBreak.BREAK_ALL).copyOption(CopyOptions.LocalDevice);
      Row({ space: this.fontSize * 0.5 }) {
        Text(`${this.item.author}${this.item.count > 0 ? this.t(` · ${this.item.count} 份清单`, ` · ${this.item.count} lists`) : ''}`)
          .fontSize(this.fontSize * 0.75).fontColor(this.theme.mutedTextColor).layoutWeight(1);
        if (this.item.homepage) {
          SettingsActionButton({ theme: this.theme, fontSize: this.fontSize, label: this.t('来源网站', 'Website'), inline: true,
            onAction: (): void => { openExternalLink(this.getUIContext().getHostContext(), this.item.homepage); } });
        }
      }.width('100%');
    }
    .alignItems(HorizontalAlign.Start).width('100%').padding(this.fontSize * 0.9)
    .backgroundColor(this.theme.surfaceBackgroundColor).borderRadius(this.fontSize * 0.8)
    .border({ width: this.fontSize * 0.07, color: this.theme.borderColor });
  }
}

@Component
export struct MarketplaceTab {
  @Prop theme: AppThemeTokens;
  @Prop fontSize: number;
  @Prop lang: 'zh' | 'en';
  @Prop @Watch('updateResults') items: Array<MarketplaceCatalog>;
  @Prop sources: Array<CatalogSource>;
  @Prop loading: boolean;
  @Prop error: string;
  @Prop message: string;
  @Prop messageError: boolean;
  @Prop saving: boolean;
  @Prop addingUrl: string;
  @Link @Watch('updateResults') query: string;
  @State private results: Array<MarketplaceCatalog> = [];
  @Link scrollIndex: number;
  scroller: ListScroller = new ListScroller();
  searchController: TextInputController = new TextInputController();
  onLoad?: () => void;
  onRefresh?: () => void;
  onAdd?: (item: MarketplaceCatalog) => void;
  onLandscapeScrollDirection?: (direction: 'up' | 'down') => void;
  onTitleAreaHeightChange?: (height: number) => void;

  private t(zh: string, en: string): string { return this.lang === 'en' ? en : zh; }
  private updateResults(): void { this.results = searchMarketplace(this.items, this.query); }
  private setQuery(value: string): void {
    this.query = value;
    this.scrollIndex = 0;
    this.scroller.scrollToIndex(0);
  }

  aboutToAppear(): void { this.updateResults(); this.onLoad?.(); }

  build() {
    Column({ space: this.fontSize * 0.8 }) {
      Column({ space: this.fontSize * 0.6 }) {
        Text(this.t('集市', 'Market')).fontSize(this.fontSize * 1.5)
          .fontWeight(FontWeight.Bold).fontColor(this.theme.accentColor);
        Row({ space: this.fontSize * 0.6 }) {
          TextInput({ text: this.query, placeholder: this.t('搜索清单源、标签或地址…', 'Search catalogs, tags or URLs…'), controller: this.searchController })
            .layoutWeight(1).fontSize(this.fontSize * 0.9).fontColor(this.theme.titleColor)
            .placeholderColor(this.theme.mutedTextColor).enableAutoFill(false)
            .backgroundColor(this.theme.surfaceBackgroundColor)
            .border({ width: this.fontSize * 0.07, color: this.theme.borderColor })
            .borderRadius(this.fontSize * 0.8)
            .padding({ left: this.fontSize * 0.8, right: this.fontSize * 0.8, top: this.fontSize * 0.6, bottom: this.fontSize * 0.6 })
            .accessibilityText(this.t('搜索集市', 'Search market'))
            .onChange((value: string): void => { this.setQuery(value); });
          if (this.query) {
            SettingsActionButton({ theme: this.theme, fontSize: this.fontSize, label: this.t('清除', 'Clear'),
              onAction: (): void => { this.setQuery(''); this.searchController.stopEditing(); } });
          }
          SettingsActionButton({ theme: this.theme, fontSize: this.fontSize, label: this.t('刷新', 'Refresh'),
            disabled: this.loading, onAction: this.onRefresh });
        }.width('100%');
        Text(this.loading ? this.t('正在更新集市…', 'Updating market…') :
          this.t(`${this.results.length} 个清单源 · 添加后在目录中浏览`, `${this.results.length} catalogs · Add to browse in Catalog`))
          .width('100%').fontSize(this.fontSize * 0.8).fontColor(this.theme.mutedTextColor);
      }
      .width('100%')
      .onAreaChange((_: Area, area: Area): void => { this.onTitleAreaHeightChange?.(lengthToNumber(area.height)); });
      List({ space: this.fontSize * 0.8, scroller: this.scroller }) {
        if (this.error) {
          ListItem() {
            Text(this.t('更新失败，仍可浏览已保存的目录。\n', 'Update failed. Saved catalogs remain available.\n') + this.error)
              .fontSize(this.fontSize * 0.85).fontColor(this.theme.dangerTextColor).width('100%')
              .copyOption(CopyOptions.LocalDevice);
          }
        }
        if (this.message) {
          ListItem() {
            Text(this.message).fontSize(this.fontSize * 0.85)
              .fontColor(this.messageError ? this.theme.dangerTextColor : this.theme.chipTextColor)
              .width('100%').copyOption(CopyOptions.LocalDevice);
          }
        }
        ForEach(this.results, (_catalog: MarketplaceCatalog, index: number) => {
          ListItem() {
            MarketplaceCard({ theme: this.theme, fontSize: this.fontSize, lang: this.lang,
              item: this.results[index],
              added: marketplaceSource(this.sources, this.results[index])?.enabled === true,
              removed: marketplaceSource(this.sources, this.results[index])?.enabled === false,
              saving: this.saving, adding: this.addingUrl === this.results[index].catalogUrl, onAdd: this.onAdd,
            });
          }
        }, (item: MarketplaceCatalog): string => item.id);
        if (this.results.length === 0 && !this.loading) {
          ListItem() {
            Column({ space: this.fontSize * 0.8 }) {
              Text(this.query.trim() ? this.t('没有找到匹配的清单源', 'No matching catalogs') : this.t('集市暂未收录清单源', 'No catalogs yet'))
                .fontSize(this.fontSize).fontColor(this.theme.titleColor);
              Text(this.t('试试主题、工具名称或域名，也可以刷新目录。', 'Try a topic, tool name or domain, or refresh the market.'))
                .fontSize(this.fontSize * 0.85).fontColor(this.theme.mutedTextColor);
              if (this.query) {
                SettingsActionButton({ theme: this.theme, fontSize: this.fontSize, label: this.t('清除搜索', 'Clear search'),
                  onAction: (): void => { this.setQuery(''); this.searchController.stopEditing(); } });
              }
            }.width('100%').padding(this.fontSize);
          }
        }
      }
      .layoutWeight(1).width('100%').scrollBar(BarState.Auto)
      .onScrollIndex((start: number): void => { this.scrollIndex = start; })
      .onDidScroll((_offset: number, state: ScrollState): void => {
        if (state !== ScrollState.Idle && Math.abs(_offset) >= this.fontSize * 0.3) {
          this.onLandscapeScrollDirection?.(_offset > 0 ? 'up' : 'down');
        }
      })
      .onAppear((): void => { this.scroller.scrollToIndex(this.scrollIndex); });
    }
    .width('100%').height('100%').padding(this.fontSize)
    .backgroundColor(this.theme.pageBackgroundColor);
  }
}

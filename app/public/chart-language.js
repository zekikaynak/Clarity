import {language} from './i18n.js';
export const chartComponentURL=(lang=language)=>`https://widgets.tradingview-widget.com/w/${lang==='tr'?'tr':'en'}/tv-advanced-chart.js`;

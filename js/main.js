// Giriş noktası: olayları bağla, temayı uygula, durumu yükle, çiz, bulutu başlat.
import './olaylar.js';
import {applyTheme} from './ui/tema.js';
import {load} from './durum.js';
import {render} from './ui/render.js';
import {cloudInit} from './bulut.js';

applyTheme();load();render();cloudInit();

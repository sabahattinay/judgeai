'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Users, Scale, Info } from 'lucide-react';

interface JuryModeToggleProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  settings?: {
    consensusRequired: boolean;
    consensusThreshold: number;
    allowRevote: boolean;
    anonymousVoting: boolean;
  };
  onSettingsChange?: (settings: any) => void;
}

export function JuryModeToggle({ 
  enabled, 
  onEnabledChange,
  settings,
  onSettingsChange 
}: JuryModeToggleProps) {
  const [showSettings, setShowSettings] = useState(false);

  const defaultSettings = {
    consensusRequired: true,
    consensusThreshold: 12,
    allowRevote: true,
    anonymousVoting: true,
  };

  const currentSettings = settings || defaultSettings;

  const handleSettingChange = (key: string, value: any) => {
    if (onSettingsChange) {
      onSettingsChange({
        ...currentSettings,
        [key]: value,
      });
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className={`h-1 ${enabled ? 'bg-gradient-to-r from-amber-400 to-yellow-500' : 'bg-gray-200'}`} />
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${enabled ? 'bg-amber-100' : 'bg-gray-100'}`}>
              <Scale className={`w-5 h-5 ${enabled ? 'text-amber-600' : 'text-gray-500'}`} />
            </div>
            <div>
              <CardTitle className="text-lg">Juri Sistemi</CardTitle>
              <CardDescription>12 kisilik juri ile karar verilsin</CardDescription>
            </div>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={onEnabledChange}
            className="data-[state=checked]:bg-amber-500"
          />
        </div>
      </CardHeader>

      {enabled && (
        <>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <Users className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">12 Juri Uyesi</p>
                <p className="text-xs text-blue-600 mt-1">
                  Juri uyeleri argumanlari degerlendirip oy kullanacak. 
                  Tam oybirligi saglanmazsa sonuclar gorsellestirilecek.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Ayarlar
              <span className={`transform transition-transform ${showSettings ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>

            {showSettings && (
              <div className="space-y-4 pt-2 border-t">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">
                      Oybirligi Esigi
                      <span className="ml-2 text-xs text-gray-500">
                        (Su an: {currentSettings.consensusThreshold}/12)
                      </span>
                    </Label>
                  </div>
                  <Slider
                    value={[currentSettings.consensusThreshold]}
                    onValueChange={([value]) => handleSettingChange('consensusThreshold', value)}
                    min={1}
                    max={12}
                    step={1}
                    className="py-2"
                  />
                  <p className="text-xs text-gray-500">
                    Kac oy ile kazanildigi. 12/12 = tam oybirligi.
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">Anonim Oylama</Label>
                    <p className="text-xs text-gray-500">Juri uyelerinin isimleri gizli kalsin</p>
                  </div>
                  <Switch
                    checked={currentSettings.anonymousVoting}
                    onCheckedChange={(checked) => handleSettingChange('anonymousVoting', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">Yeniden Oylama</Label>
                    <p className="text-xs text-gray-500">Juri uyeleri oylerini degistirebilsin</p>
                  </div>
                  <Switch
                    checked={currentSettings.allowRevote}
                    onCheckedChange={(checked) => handleSettingChange('allowRevote', checked)}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </>
      )}

      {!enabled && (
        <CardContent className="pt-0">
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <Info className="w-4 h-4 text-gray-500 mt-0.5" />
            <p className="text-xs text-gray-600">
              Standart modda sadece iki kullanicinin argumanlari AI tarafindan degerlendirilir.
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

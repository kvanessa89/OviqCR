/* global React, ReactDOM */

const { useEffect } = React;
const { useTweaks, TweaksPanel, TweakSection, TweakRadio } = window;

const OVIQ_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "skin": "corporativo",
  "density": "comfy",
  "kpi": "tarjetas"
}/*EDITMODE-END*/;

function OVIQ_TweaksPanel() {
  const [t, setTweak] = useTweaks(OVIQ_TWEAK_DEFAULTS);

  // Reflect tweak state on <html> so the CSS in oviq-skins.css can target it.
  useEffect(() => {
    const r = document.documentElement;
    r.setAttribute('data-skin', t.skin || 'corporativo');
    r.setAttribute('data-density', t.density || 'comfy');
    r.setAttribute('data-kpi', t.kpi || 'tarjetas');
  }, [t.skin, t.density, t.kpi]);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Aspecto" />
      <TweakRadio
        label="Skin"
        value={t.skin}
        options={[
          { value: 'corporativo', label: 'Corporativo' },
          { value: 'editorial',   label: 'Editorial' },
          { value: 'terminal',    label: 'Terminal' },
        ]}
        onChange={(v) => setTweak('skin', v)}
      />
      <TweakSection label="Densidad" />
      <TweakRadio
        label="Espaciado"
        value={t.density}
        options={[
          { value: 'comfy',   label: 'Cómodo' },
          { value: 'compact', label: 'Compacto' },
        ]}
        onChange={(v) => setTweak('density', v)}
      />
      <TweakSection label="Vista rápida" />
      <TweakRadio
        label="KPIs"
        value={t.kpi}
        options={[
          { value: 'tarjetas', label: 'Tarjetas' },
          { value: 'strip',    label: 'Tira' },
          { value: 'hero',     label: 'Hero' },
        ]}
        onChange={(v) => setTweak('kpi', v)}
      />
    </TweaksPanel>
  );
}

window.OVIQ_TweaksPanel = OVIQ_TweaksPanel;

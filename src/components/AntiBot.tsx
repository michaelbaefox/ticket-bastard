import React, { useState, useEffect } from 'react';
import { AlertTriangle, Shield, Clock } from 'lucide-react';

type AntiBotProps = {
  onVerify: () => void;
  actionType: 'purchase' | 'transfer' | 'list';
};

const AntiBot = ({ onVerify, actionType }: AntiBotProps) => {
  const [step, setStep] = useState<'warning' | 'captcha' | 'cooldown'>('warning');
  const [countdown, setCountdown] = useState(3);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaProblem, setCaptchaProblem] = useState({ a: 0, b: 0, answer: 0 });

  // Generate simple math captcha
  useEffect(() => {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    setCaptchaProblem({ a, b, answer: a + b });
  }, []);

  // Countdown timer for cooldown
  useEffect(() => {
    if (step === 'cooldown' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (step === 'cooldown' && countdown === 0) {
      onVerify();
    }
  }, [step, countdown, onVerify]);

  const handleCaptchaSubmit = () => {
    if (parseInt(captchaAnswer) === captchaProblem.answer) {
      setStep('cooldown');
      setCountdown(3);
    } else {
      // Regenerate captcha on wrong answer
      const a = Math.floor(Math.random() * 10) + 1;
      const b = Math.floor(Math.random() * 10) + 1;
      setCaptchaProblem({ a, b, answer: a + b });
      setCaptchaAnswer('');
    }
  };

  const getActionLabel = () => {
    switch (actionType) {
      case 'purchase': return 'ticket purchase';
      case 'transfer': return 'ticket transfer';
      case 'list': return 'ticket listing';
    }
  };

  if (step === 'warning') {
    return (
      <div className="p-4 border border-yellow-500/30 rounded-md bg-yellow-500/10 space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-yellow-500" />
          <div className="font-mono uppercase text-sm text-yellow-500">ANTI-BOT VERIFICATION</div>
        </div>
        
        <div className="text-sm text-neo-contrast/90">
          To prevent automated abuse and ensure fair access, we need to verify you're human before completing this {getActionLabel()}.
        </div>
        
        <button
          onClick={() => setStep('captcha')}
          className="w-full px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-md font-mono uppercase text-sm hover:bg-yellow-500/30 transition-colors"
        >
          [ PROCEED TO VERIFICATION ]
        </button>
      </div>
    );
  }

  if (step === 'captcha') {
    return (
      <div className="p-4 border border-neo-border/20 rounded-md bg-neo-contrast/5 space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-neo-contrast/60" />
          <div className="font-mono uppercase text-sm">HUMAN VERIFICATION</div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-mono mb-2">
            {captchaProblem.a} + {captchaProblem.b} = ?
          </div>
          <input
            type="number"
            value={captchaAnswer}
            onChange={(e) => setCaptchaAnswer(e.target.value)}
            className="w-20 px-3 py-2 bg-neo-contrast-inverse border border-neo-border/20 rounded-md text-center font-mono"
            placeholder="?"
            autoFocus
          />
        </div>
        
        <button
          onClick={handleCaptchaSubmit}
          disabled={!captchaAnswer}
          className="w-full px-4 py-2 bg-neo-contrast/10 border border-neo-border/20 rounded-md font-mono uppercase text-sm hover:bg-neo-contrast/20 transition-colors disabled:opacity-50"
        >
          [ VERIFY ]
        </button>
      </div>
    );
  }

  if (step === 'cooldown') {
    return (
      <div className="p-4 border border-green-500/30 rounded-md bg-green-500/10 space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-green-500" />
          <div className="font-mono uppercase text-sm text-green-500">VERIFICATION COMPLETE</div>
        </div>
        
        <div className="text-center">
          <div className="text-sm text-neo-contrast/90 mb-2">
            Proceeding with {getActionLabel()} in:
          </div>
          <div className="text-2xl font-mono font-bold text-green-500">
            {countdown}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default AntiBot;
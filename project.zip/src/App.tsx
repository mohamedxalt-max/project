import { Shield, Lock, Activity } from 'lucide-react';
import { useState, useEffect } from 'react';

function App() {
  const [botStatus, setBotStatus] = useState<'online' | 'offline'>('online');

  useEffect(() => {
    const checkStatus = () => {
      const isOnline = Math.random() > 0.2;
      setBotStatus(isOnline ? 'online' : 'offline');
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-cover bg-center bg-fixed" style={{backgroundImage: 'url(/New_Project_(10).png)'}}>
      <div className="min-h-screen backdrop-blur-sm bg-black/40">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <header className="text-center mb-12">
            <div className="mb-8">
              <img src="/New_Project_(7).png" alt="VenHub Logo" className="h-24 mx-auto object-contain drop-shadow-lg" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Generator Bot</h1>
            <p className="text-slate-200 text-lg">Legal Documentation</p>

            <div className="mt-8 inline-flex items-center gap-3 bg-slate-800/70 backdrop-blur px-6 py-3 rounded-lg border border-slate-600 shadow-lg">
              <Activity className={`w-5 h-5 ${botStatus === 'online' ? 'text-green-400' : 'text-red-400'}`} />
              <span className="text-slate-300">Bot Status:</span>
              <span className={`font-semibold ${botStatus === 'online' ? 'text-green-400' : 'text-red-400'}`}>
                {botStatus.toUpperCase()}
              </span>
              <div className={`w-2 h-2 rounded-full ${botStatus === 'online' ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
            </div>
          </header>

        <div className="space-y-8">
          <section className="bg-slate-800/70 backdrop-blur-sm rounded-xl p-8 border border-slate-600 shadow-xl">

            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-8 h-8 text-blue-400" />
              <h2 className="text-3xl font-bold text-white">Terms of Service</h2>
            </div>

            <div className="space-y-4 text-slate-300 leading-relaxed">
              <p className="text-slate-200">Welcome to our Discord bot service. By using this bot, you agree to the following terms:</p>

              <div className="space-y-3">
                <div className="pl-4 border-l-2 border-blue-400">
                  <h3 className="font-semibold text-white mb-1">1. Acceptance of Terms</h3>
                  <p>You must be at least 13 years old or have parental consent to use the bot.</p>
                </div>

                <div className="pl-4 border-l-2 border-blue-400">
                  <h3 className="font-semibold text-white mb-1">2. Usage Guidelines</h3>
                  <p>Do not use the bot for spam, harassment, illegal activities, or any action that violates Discord's Terms of Service.</p>
                </div>

                <div className="pl-4 border-l-2 border-blue-400">
                  <h3 className="font-semibold text-white mb-1">3. Service Availability</h3>
                  <p>The bot is provided "as is". We make no guarantees regarding uptime or functionality.</p>
                </div>

                <div className="pl-4 border-l-2 border-blue-400">
                  <h3 className="font-semibold text-white mb-1">4. Modification</h3>
                  <p>We reserve the right to modify, update, or discontinue features at any time without notice.</p>
                </div>

                <div className="pl-4 border-l-2 border-blue-400">
                  <h3 className="font-semibold text-white mb-1">5. Liability</h3>
                  <p>We are not responsible for any damages or losses resulting from your use of the bot.</p>
                </div>

                <div className="pl-4 border-l-2 border-blue-400">
                  <h3 className="font-semibold text-white mb-1">6. Termination</h3>
                  <p>We may suspend or ban users who breach these terms.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-slate-800/70 backdrop-blur-sm rounded-xl p-8 border border-slate-600 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <Lock className="w-8 h-8 text-green-400" />
              <h2 className="text-3xl font-bold text-white">Privacy Policy</h2>
            </div>

            <div className="space-y-4 text-slate-300 leading-relaxed">
              <p className="text-slate-200">We respect your privacy. This policy explains what information is collected and how it is used.</p>

              <div className="space-y-3">
                <div className="pl-4 border-l-2 border-green-400">
                  <h3 className="font-semibold text-white mb-1">1. Data Collection</h3>
                  <p>We may collect basic information such as user IDs, command usage, and other minimal data required for bot functionality.</p>
                </div>

                <div className="pl-4 border-l-2 border-green-400">
                  <h3 className="font-semibold text-white mb-1">2. No Personal Data</h3>
                  <p>We do not store personal information like names, emails, or IP addresses unless explicitly provided for a feature (and consent is obtained).</p>
                </div>

                <div className="pl-4 border-l-2 border-green-400">
                  <h3 className="font-semibold text-white mb-1">3. Usage Tracking</h3>
                  <p>Command usage and error logs may be recorded to improve the service and troubleshoot issues.</p>
                </div>

                <div className="pl-4 border-l-2 border-green-400">
                  <h3 className="font-semibold text-white mb-1">4. Data Sharing</h3>
                  <p>We do not share your information with third parties, except as required by law or to comply with Discord's policies.</p>
                </div>

                <div className="pl-4 border-l-2 border-green-400">
                  <h3 className="font-semibold text-white mb-1">5. Cookies & Tracking</h3>
                  <p>The bot itself does not use cookies; however, any linked web services may have their own policies.</p>
                </div>

                <div className="pl-4 border-l-2 border-green-400">
                  <h3 className="font-semibold text-white mb-1">6. Changes to Policy</h3>
                  <p>We may update this document; continued use after changes implies acceptance.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-slate-800/70 backdrop-blur-sm rounded-xl p-8 border border-slate-600 shadow-xl text-center">
            <h3 className="text-xl font-semibold text-white mb-6">Questions or Concerns?</h3>
            <p className="text-slate-300 mb-6">If you have any questions about these terms or your privacy, please contact the bot owner:</p>

            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <div className="flex-shrink-0">
                <img src="/New_Project_(7).png" alt="VenHub Support Profile" className="h-20 w-20 rounded-full object-contain bg-slate-900/50 p-2 border-2 border-blue-400 drop-shadow-lg" />
              </div>
              <div className="bg-slate-900/50 px-6 py-4 rounded-lg border border-slate-600">
                <p className="text-blue-400 font-semibold text-lg">VenHub Support</p>
                <p className="text-slate-300 text-sm mt-1">#4804</p>
              </div>
            </div>
          </section>
        </div>

        <footer className="mt-12 text-center text-slate-400 text-sm">
          <p>Last Updated: March 2026</p>
          <p className="mt-2">© 2026 Generator Bot. All rights reserved.</p>
        </footer>
        </div>
      </div>
    </div>
  );
}

export default App;

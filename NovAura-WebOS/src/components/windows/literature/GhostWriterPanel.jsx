import React, { useState, useEffect } from 'react';
import { 
  Feather, Star, DollarSign, Clock, Shield, CheckCircle,
  Search, Filter, Plus, MessageSquare, FileText, Crown,
  TrendingUp, Users, Award, Briefcase, ChevronDown, ChevronRight,
  AlertCircle, BookOpen, Zap
} from 'lucide-react';
import { GhostWriterMarketplace, COMMISSION_TYPES, WRITER_TIERS } from './GhostWriterMarketplace';

export default function GhostWriterPanel({ mode = 'browse', userType = 'client', userId }) {
  const [marketplace] = useState(() => new GhostWriterMarketplace());
  const [activeTab, setActiveTab] = useState(mode === 'browse' ? 'commissions' : 'dashboard');
  const [commissions, setCommissions] = useState([]);
  const [writers, setWriters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCommission, setSelectedCommission] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [commList, writerList] = await Promise.all([
        marketplace.searchCommissions(filters),
        marketplace.searchWriters(filters)
      ]);
      setCommissions(commList);
      setWriters(writerList);
    } catch (err) {
      console.error('Failed to load marketplace data:', err);
    }
    setLoading(false);
  };

  const getTierColor = (tierId) => {
    return WRITER_TIERS[tierId?.toUpperCase()]?.color || '#6b7280';
  };

  const getTypeInfo = (typeId) => {
    return COMMISSION_TYPES[typeId] || null;
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e2e] text-gray-300">
      {/* Header */}
      <div className="px-3 py-2 border-b border-[#2a2a4a]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Feather className="w-4 h-4 text-purple-400" />
            <span className="text-[11px] uppercase tracking-wider text-gray-500">Ghost Writer Marketplace</span>
          </div>
          {userType === 'client' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1 px-2 py-1 bg-purple-400/20 text-purple-400 rounded text-[10px] hover:bg-purple-400/30"
            >
              <Plus className="w-3 h-3" /> Post Commission
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-t border-[#2a2a4a] mt-2 pt-2">
          {[
            { id: 'commissions', label: 'Commissions', icon: Briefcase },
            { id: 'writers', label: 'Writers', icon: Users },
            { id: 'dashboard', label: 'My Dashboard', icon: TrendingUp },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1 py-1 text-[10px] transition-colors ${
                activeTab === tab.id
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <tab.icon className="w-3 h-3" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'commissions' && (
          <CommissionsList 
            commissions={commissions}
            loading={loading}
            onSelect={setSelectedCommission}
            getTypeInfo={getTypeInfo}
          />
        )}

        {activeTab === 'writers' && (
          <WritersList 
            writers={writers}
            loading={loading}
            getTierColor={getTierColor}
          />
        )}

        {activeTab === 'dashboard' && (
          <Dashboard 
            userType={userType}
            marketplace={marketplace}
            userId={userId}
          />
        )}
      </div>

      {/* Commission Detail Modal */}
      {selectedCommission && (
        <CommissionDetailModal 
          commission={selectedCommission}
          onClose={() => setSelectedCommission(null)}
          getTypeInfo={getTypeInfo}
          userType={userType}
        />
      )}

      {/* Create Commission Modal */}
      {showCreateModal && (
        <CreateCommissionModal 
          onClose={() => setShowCreateModal(false)}
          onSubmit={(brief) => {
            marketplace.createCommissionBrief(userId, brief);
            setShowCreateModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}

// Commissions List Component
function CommissionsList({ commissions, loading, onSelect, getTypeInfo }) {
  if (loading) {
    return (
      <div className="text-center py-8 text-gray-600">
        <div className="w-8 h-8 mx-auto mb-2 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-[11px]">Loading commissions...</p>
      </div>
    );
  }

  if (commissions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600">
        <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-[11px]">No open commissions</p>
        <p className="text-[10px] text-gray-700 mt-1">
          Be the first to post a writing project!
        </p>
      </div>
    );
  }

  return (
    <div className="p-2 space-y-2">
      {commissions.map(comm => {
        const typeInfo = getTypeInfo(comm.type);
        return (
          <div
            key={comm.id}
            onClick={() => onSelect(comm)}
            className="p-2 rounded border border-gray-700 bg-[#252540] hover:border-purple-400/50 cursor-pointer transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium truncate">{comm.title}</p>
                <p className="text-[9px] text-gray-500 line-clamp-2 mt-0.5">
                  {comm.description}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[8px] px-1.5 py-0.5 rounded bg-purple-400/20 text-purple-400">
                    {typeInfo?.name || comm.type}
                  </span>
                  <span className="text-[8px] text-gray-500">
                    {comm.bids?.length || 0} bids
                  </span>
                </div>
              </div>
              <div className="text-right ml-2">
                <p className="text-[10px] text-green-400">
                  ${comm.budget.min}-${comm.budget.max}
                </p>
                <p className="text-[8px] text-gray-500">
                  +{comm.budget.royaltyPercentage}% royalty
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Writers List Component
function WritersList({ writers, loading, getTierColor }) {
  if (loading) {
    return (
      <div className="text-center py-8 text-gray-600">
        <div className="w-8 h-8 mx-auto mb-2 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-[11px]">Loading writers...</p>
      </div>
    );
  }

  return (
    <div className="p-2 space-y-2">
      {writers.map(writer => (
        <div
          key={writer.userId}
          className="p-2 rounded border border-gray-700 bg-[#252540] hover:border-purple-400/50 cursor-pointer transition-colors"
        >
          <div className="flex items-start gap-2">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
              style={{ backgroundColor: getTierColor(writer.stats?.tier) }}
            >
              {writer.displayName?.[0] || 'W'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-[11px] font-medium">{writer.displayName}</p>
                <Crown 
                  className="w-3 h-3" 
                  style={{ color: getTierColor(writer.stats?.tier) }}
                />
              </div>
              <p className="text-[9px] text-gray-500 line-clamp-1">
                {writer.bio}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[8px] text-gray-400">
                  ⭐ {writer.stats?.averageRating?.toFixed(1) || '0.0'}
                </span>
                <span className="text-[8px] text-gray-400">
                  ({writer.stats?.reviewCount || 0} reviews)
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {writer.specialties?.slice(0, 3).map((specialty, i) => (
              <span 
                key={i}
                className="text-[8px] px-1.5 py-0.5 rounded bg-white/10 text-gray-400"
              >
                {specialty}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Dashboard Component
function Dashboard({ userType, marketplace, userId }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (userType === 'writer') {
      marketplace.getWriterRoyalties(userId).then(setStats);
    }
  }, [userType, marketplace, userId]);

  if (userType === 'writer') {
    return (
      <div className="p-3 space-y-3">
        {/* Earnings */}
        <div className="p-3 bg-[#252540] rounded">
          <p className="text-[10px] text-gray-500 mb-2">Total Earnings</p>
          <p className="text-xl font-bold text-green-400">
            ${stats?.totalEarned?.toFixed(2) || '0.00'}
          </p>
          <p className="text-[9px] text-gray-500 mt-1">
            Projected annual: ${stats?.projectedAnnual?.toFixed(2) || '0.00'}
          </p>
        </div>

        {/* Active Contracts */}
        <div>
          <p className="text-[10px] text-gray-500 mb-2">Active Royalty Contracts</p>
          <div className="space-y-1">
            {stats?.contracts?.slice(0, 5).map(contract => (
              <div key={contract.id} className="p-2 rounded bg-[#252540] text-[10px]">
                <div className="flex justify-between">
                  <span className="text-gray-300">Game Project</span>
                  <span className="text-purple-400">{contract.royaltyPercentage}%</span>
                </div>
                <p className="text-[9px] text-gray-500 mt-0.5">
                  Earned: ${contract.usage.royaltiesPaid.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Client dashboard
  return (
    <div className="p-3 space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 bg-[#252540] rounded text-center">
          <p className="text-lg font-bold text-purple-400">0</p>
          <p className="text-[9px] text-gray-500">Active Commissions</p>
        </div>
        <div className="p-2 bg-[#252540] rounded text-center">
          <p className="text-lg font-bold text-green-400">0</p>
          <p className="text-[9px] text-gray-500">Completed</p>
        </div>
      </div>
      
      <button 
        onClick={() => {}}
        className="w-full py-2 bg-purple-400/20 text-purple-400 rounded text-[11px] hover:bg-purple-400/30"
      >
        Post New Commission
      </button>
    </div>
  );
}

// Create Commission Modal
function CreateCommissionModal({ onClose, onSubmit }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    type: 'game_dialogue',
    title: '',
    description: '',
    gameGenre: '',
    tone: '',
    wordCount: '',
    budgetMin: '',
    budgetMax: '',
    royaltyPercentage: 10,
    deadline: '',
    characters: [],
    mustInclude: '',
    avoid: ''
  });

  const typeInfo = COMMISSION_TYPES[formData.type];

  const handleSubmit = () => {
    onSubmit({
      ...formData,
      mustInclude: formData.mustInclude.split('\n').filter(i => i.trim()),
      avoid: formData.avoid.split('\n').filter(i => i.trim())
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-[#1e1e2e] rounded-lg border border-gray-700 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-sm font-medium">Create Commission</h3>
          <p className="text-[10px] text-gray-500 mt-1">Step {step} of 3</p>
        </div>

        <div className="p-4 space-y-3">
          {step === 1 && (
            <>
              <div>
                <label className="text-[10px] text-gray-500 block mb-1">Commission Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full bg-[#252540] text-gray-300 text-[11px] rounded px-2 py-1.5 border border-gray-700 outline-none"
                >
                  {Object.entries(COMMISSION_TYPES).map(([id, info]) => (
                    <option key={id} value={id}>{info.name}</option>
                  ))}
                </select>
                <p className="text-[9px] text-gray-500 mt-1">{typeInfo?.description}</p>
              </div>

              <div>
                <label className="text-[10px] text-gray-500 block mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., RPG Dialogue for Fantasy Game"
                  className="w-full bg-[#252540] text-gray-300 text-[11px] rounded px-2 py-1.5 border border-gray-700 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-500 block mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your project and what you need..."
                  rows={3}
                  className="w-full bg-[#252540] text-gray-300 text-[11px] rounded px-2 py-1.5 border border-gray-700 outline-none resize-none"
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1">Game Genre</label>
                  <input
                    type="text"
                    value={formData.gameGenre}
                    onChange={(e) => setFormData({ ...formData, gameGenre: e.target.value })}
                    placeholder="e.g., Fantasy RPG"
                    className="w-full bg-[#252540] text-gray-300 text-[11px] rounded px-2 py-1.5 border border-gray-700 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1">Tone</label>
                  <select
                    value={formData.tone}
                    onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                    className="w-full bg-[#252540] text-gray-300 text-[11px] rounded px-2 py-1.5 border border-gray-700 outline-none"
                  >
                    <option value="">Select...</option>
                    <option value="serious">Serious</option>
                    <option value="humorous">Humorous</option>
                    <option value="dark">Dark</option>
                    <option value="lighthearted">Lighthearted</option>
                    <option value="epic">Epic</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-gray-500 block mb-1">Budget Range ($)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={formData.budgetMin}
                    onChange={(e) => setFormData({ ...formData, budgetMin: e.target.value })}
                    placeholder="Min"
                    className="flex-1 bg-[#252540] text-gray-300 text-[11px] rounded px-2 py-1.5 border border-gray-700 outline-none"
                  />
                  <span className="text-gray-500">-</span>
                  <input
                    type="number"
                    value={formData.budgetMax}
                    onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
                    placeholder="Max"
                    className="flex-1 bg-[#252540] text-gray-300 text-[11px] rounded px-2 py-1.5 border border-gray-700 outline-none"
                  />
                </div>
                <p className="text-[9px] text-gray-500 mt-1">
                  Suggested: ${typeInfo?.minPrice}+ for this type
                </p>
              </div>

              <div>
                <label className="text-[10px] text-gray-500 block mb-1">
                  Royalty Percentage (%)
                </label>
                <input
                  type="number"
                  value={formData.royaltyPercentage}
                  onChange={(e) => setFormData({ ...formData, royaltyPercentage: e.target.value })}
                  min="0"
                  max="50"
                  className="w-full bg-[#252540] text-gray-300 text-[11px] rounded px-2 py-1.5 border border-gray-700 outline-none"
                />
                <p className="text-[9px] text-gray-500 mt-1">
                  Default for this type: {typeInfo?.defaultRoyalty}%
                </p>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <label className="text-[10px] text-gray-500 block mb-1">
                  Must Include (one per line)
                </label>
                <textarea
                  value={formData.mustInclude}
                  onChange={(e) => setFormData({ ...formData, mustInclude: e.target.value })}
                  placeholder="e.g.,\nA mysterious stranger\nPlot twist in Act 2\nComic relief character"
                  rows={3}
                  className="w-full bg-[#252540] text-gray-300 text-[11px] rounded px-2 py-1.5 border border-gray-700 outline-none resize-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-500 block mb-1">
                  Things to Avoid (one per line)
                </label>
                <textarea
                  value={formData.avoid}
                  onChange={(e) => setFormData({ ...formData, avoid: e.target.value })}
                  placeholder="e.g.,\nReligious themes\nGraphic violence\nSpecific words..."
                  rows={3}
                  className="w-full bg-[#252540] text-gray-300 text-[11px] rounded px-2 py-1.5 border border-gray-700 outline-none resize-none"
                />
              </div>

              <div className="p-3 bg-purple-400/10 rounded border border-purple-400/30">
                <p className="text-[10px] text-purple-400 font-medium">Rights & Royalties</p>
                <p className="text-[9px] text-gray-400 mt-1">
                  {typeInfo?.rights}
                </p>
                <p className="text-[9px] text-gray-500 mt-1">
                  Writer will receive {formData.royaltyPercentage}% of game revenue in perpetuity.
                </p>
              </div>
            </>
          )}
        </div>

        <div className="p-4 border-t border-gray-700 flex gap-2">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-3 py-1.5 bg-white/10 text-gray-400 rounded text-[11px] hover:bg-white/15"
            >
              Back
            </button>
          )}
          <button
            onClick={() => step < 3 ? setStep(step + 1) : handleSubmit()}
            className="flex-1 px-3 py-1.5 bg-purple-400/20 text-purple-400 rounded text-[11px] hover:bg-purple-400/30"
          >
            {step < 3 ? 'Next' : 'Create Commission'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Commission Detail Modal (simplified)
function CommissionDetailModal({ commission, onClose, getTypeInfo, userType }) {
  const typeInfo = getTypeInfo(commission.type);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-[#1e1e2e] rounded-lg border border-gray-700 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-700 flex justify-between items-start">
          <div>
            <h3 className="text-sm font-medium">{commission.title}</h3>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-400/20 text-purple-400 mt-1 inline-block">
              {typeInfo?.name}
            </span>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300">
            ✕
          </button>
        </div>

        <div className="p-4 space-y-3">
          <p className="text-[11px] text-gray-300">{commission.description}</p>

          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="p-2 bg-[#252540] rounded">
              <p className="text-gray-500">Budget</p>
              <p className="text-green-400">${commission.budget.min}-${commission.budget.max}</p>
            </div>
            <div className="p-2 bg-[#252540] rounded">
              <p className="text-gray-500">Royalty</p>
              <p className="text-purple-400">{commission.budget.royaltyPercentage}%</p>
            </div>
          </div>

          {userType === 'writer' && (
            <button 
              onClick={() => {}}
              className="w-full py-2 bg-green-400/20 text-green-400 rounded text-[11px] hover:bg-green-400/30"
            >
              Submit Bid
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

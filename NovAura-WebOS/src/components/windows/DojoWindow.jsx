import React, { useState, useCallback } from 'react';
import { 
  Swords, Copy, Download, Play, Code2, ChevronDown, Sparkles,
  Save, FolderOpen, FileArchive, Cloud, Wand2, GitBranch,
  CheckSquare, Lightbulb, Zap, RefreshCw
} from 'lucide-react';
import { exportProjectAsZip, exportAsJson, downloadFile } from '../../utils/exportUtils';

const ENGINES = [
  { id: 'unreal', label: 'Unreal Engine', lang: 'C++', ext: '.cpp', icon: '🎮', color: 'text-blue-400' },
  { id: 'unity', label: 'Unity', lang: 'C#', ext: '.cs', icon: '🔷', color: 'text-cyan-400' },
  { id: 'godot', label: 'Godot', lang: 'GDScript', ext: '.gd', icon: '🤖', color: 'text-green-400' },
];

const ASSET_TYPES = [
  { id: 'character-controller', label: 'Character Controller', desc: 'Player movement, jumping, camera', complexity: 'medium' },
  { id: 'enemy-ai', label: 'Enemy AI', desc: 'Patrol, chase, attack behaviors', complexity: 'high' },
  { id: 'inventory', label: 'Inventory System', desc: 'Item slots, stacking, equipping', complexity: 'medium' },
  { id: 'ui-hud', label: 'UI / HUD', desc: 'Health bar, minimap, score display', complexity: 'low' },
  { id: 'dialogue', label: 'Dialogue System', desc: 'NPC conversations, branching choices', complexity: 'medium' },
  { id: 'combat', label: 'Combat System', desc: 'Melee/ranged attacks, damage, abilities', complexity: 'high' },
  { id: 'save-load', label: 'Save / Load', desc: 'Game state persistence and recovery', complexity: 'medium' },
  { id: 'particles', label: 'Particle Effects', desc: 'Fire, smoke, magic, explosions', complexity: 'low' },
  { id: 'procedural', label: 'Procedural Generation', desc: 'Random levels, items, terrain', complexity: 'high' },
  { id: 'multiplayer', label: 'Multiplayer Networking', desc: 'Sync, lobby, matchmaking', complexity: 'very-high' },
];

// Pre-built templates for common assets
const TEMPLATES = {
  'unreal': {
    'character-controller': generateUnrealCharacterController(),
    'enemy-ai': generateUnrealEnemyAI(),
    'inventory': generateUnrealInventory(),
    'combat': generateUnrealCombat(),
  },
  'unity': {
    'character-controller': generateUnityCharacterController(),
    'enemy-ai': generateUnityEnemyAI(),
    'inventory': generateUnityInventory(),
    'combat': generateUnityCombat(),
  },
  'godot': {
    'character-controller': generateGodotCharacterController(),
    'enemy-ai': generateGodotEnemyAI(),
    'inventory': generateGodotInventory(),
    'combat': generateGodotCombat(),
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// AI-POWERED DOJO
// Design-first game asset generation with visual logic mapping
// ═══════════════════════════════════════════════════════════════════════════════

export default function DojoWindow({ onAIChat }) {
  // ── State ───────────────────────────────────────────────────────────────────
  const [engine, setEngine] = useState('godot');
  const [assetType, setAssetType] = useState('character-controller');
  const [code, setCode] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('generate'); // generate | design | logic
  
  // Design phase state
  const [designAnswers, setDesignAnswers] = useState({});
  const [logicMap, setLogicMap] = useState([]);
  const [features, setFeatures] = useState([]);

  const currentEngine = ENGINES.find(e => e.id === engine);
  const currentAsset = ASSET_TYPES.find(a => a.id === assetType);

  // ── Generation Handlers ──────────────────────────────────────────────────────

  const generateWithAI = useCallback(async () => {
    if (!onAIChat) {
      // Fall back to template
      const template = TEMPLATES[engine]?.[assetType];
      if (template) {
        setCode(template);
      } else {
        setCode(generatePlaceholder(engine, assetType));
      }
      return;
    }

    setGenerating(true);
    try {
      const prompt = customPrompt.trim() || 
        `Generate a complete, production-ready ${currentAsset.label} for ${currentEngine.label} in ${currentEngine.lang}. 
        
Requirements:
${currentAsset.desc}
- Include detailed comments explaining the logic
- Follow best practices for ${currentEngine.label}
- Handle edge cases and errors
- Optimize for performance
- Include setup instructions in comments

Design considerations:
${logicMap.map(l => `- ${l}`).join('\n')}

Generate the complete code that can be dropped into a project and work immediately.`;

      const result = await onAIChat(prompt, 'coding');
      
      if (result?.code || result?.response) {
        setCode(result.code || result.response);
        
        // Auto-detect features from AI response
        const detectedFeatures = extractFeaturesFromCode(result.code || result.response);
        setFeatures(detectedFeatures);
      } else {
        throw new Error('No code generated');
      }
    } catch (err) {
      console.error('AI generation failed:', err);
      // Fallback to template
      const template = TEMPLATES[engine]?.[assetType];
      setCode(template || generatePlaceholder(engine, assetType));
    } finally {
      setGenerating(false);
    }
  }, [engine, assetType, customPrompt, onAIChat, currentAsset, currentEngine, logicMap]);

  const generateDesignFirst = useCallback(async () => {
    if (!onAIChat) return;
    
    setGenerating(true);
    try {
      // First, generate the design/logic map
      const designPrompt = `As a game architect, design a ${currentAsset.label} system for ${currentEngine.label}.

Requirements: ${currentAsset.desc}

Please provide:
1. A logic flow description (step-by-step behavior)
2. Key features this system needs
3. Edge cases to handle
4. Component breakdown

Format as a structured design document.`;

      const designResult = await onAIChat(designPrompt, 'coding');
      
      // Parse the design result
      const parsedDesign = parseDesignResponse(designResult.response || designResult.code);
      setLogicMap(parsedDesign.logicFlow);
      setFeatures(parsedDesign.features);
      
      // Then generate code based on design
      const codePrompt = `Implement the following ${currentAsset.label} design for ${currentEngine.label} in ${currentEngine.lang}:

Design:
${parsedDesign.logicFlow.join('\n')}

Features to implement:
${parsedDesign.features.map(f => `- ${f.name}: ${f.description}`).join('\n')}

Generate complete, production-ready code with comments.`;

      const codeResult = await onAIChat(codePrompt, 'coding');
      setCode(codeResult.code || codeResult.response);
      setActiveTab('generate');
      
    } catch (err) {
      console.error('Design-first generation failed:', err);
    } finally {
      setGenerating(false);
    }
  }, [engine, assetType, onAIChat, currentAsset, currentEngine]);

  // ── Export Handlers ──────────────────────────────────────────────────────────

  const copyCode = () => {
    navigator.clipboard.writeText(code);
  };

  const downloadCode = () => {
    const filename = `${assetType}${currentEngine.ext}`;
    downloadFile(code, filename);
  };

  const exportAssetPackage = async () => {
    const files = [
      { name: `src/${assetType}${currentEngine.ext}`, content: code },
      { name: 'README.md', content: generateAssetReadme() },
      { name: '.novaura/asset.json', content: JSON.stringify({
        engine: engine,
        assetType: assetType,
        generatedAt: new Date().toISOString(),
        features: features
      }, null, 2)}
    ];

    await exportProjectAsZip({
      files,
      projectName: `${currentAsset.label}-${currentEngine.label}`,
      metadata: {
        engine,
        assetType,
        type: 'game-asset'
      }
    });
  };

  const generateAssetReadme = () => `# ${currentAsset.label}

**Engine:** ${currentEngine.label}  
**Language:** ${currentEngine.lang}

## Description
${currentAsset.desc}

## Features
${features.map(f => `- ${f.name}`).join('\n')}

## Installation
1. Copy the code from \`src/${assetType}${currentEngine.ext}\`
2. Add it to your ${currentEngine.label} project
3. Follow any setup instructions in the code comments

## Usage
See inline comments in the code for usage examples.

---
Generated with NovAura Dojo
`;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-orange-900/30 to-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-600/20 flex items-center justify-center">
            <Swords className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h1 className="font-bold text-white">Dojo</h1>
            <p className="text-xs text-slate-500">Game Asset Generator</p>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex items-center gap-1 bg-slate-900 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('generate')}
            className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-2 transition-colors ${
              activeTab === 'generate' ? 'bg-orange-600/30 text-orange-300' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Generate
          </button>
          <button
            onClick={() => setActiveTab('design')}
            className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-2 transition-colors ${
              activeTab === 'design' ? 'bg-orange-600/30 text-orange-300' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lightbulb className="w-4 h-4" />
            Design
          </button>
          <button
            onClick={() => setActiveTab('logic')}
            className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-2 transition-colors ${
              activeTab === 'logic' ? 'bg-orange-600/30 text-orange-300' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitBranch className="w-4 h-4" />
            Logic
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Configuration */}
        <div className="w-72 border-r border-slate-800 overflow-y-auto p-4 space-y-4 shrink-0">
          {/* Engine Selection */}
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 block">
              Game Engine
            </label>
            <div className="space-y-2">
              {ENGINES.map(e => (
                <button
                  key={e.id}
                  onClick={() => setEngine(e.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all border ${
                    engine === e.id
                      ? 'bg-orange-600/20 border-orange-600/50 text-white'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="text-2xl">{e.icon}</span>
                  <div>
                    <div className={`font-medium ${engine === e.id ? 'text-orange-300' : 'text-slate-300'}`}>
                      {e.label}
                    </div>
                    <div className="text-xs text-slate-500">{e.lang}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Asset Type */}
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 block">
              Asset Type
            </label>
            <div className="space-y-1">
              {ASSET_TYPES.map(a => (
                <button
                  key={a.id}
                  onClick={() => setAssetType(a.id)}
                  className={`w-full text-left p-2.5 rounded-lg text-sm transition-colors flex items-center justify-between ${
                    assetType === a.id
                      ? 'bg-orange-600/20 text-orange-300'
                      : 'text-slate-400 hover:bg-slate-900'
                  }`}
                >
                  <span>{a.label}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    a.complexity === 'low' ? 'bg-green-900/50 text-green-400' :
                    a.complexity === 'medium' ? 'bg-yellow-900/50 text-yellow-400' :
                    a.complexity === 'high' ? 'bg-orange-900/50 text-orange-400' :
                    'bg-red-900/50 text-red-400'
                  }`}>
                    {a.complexity}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Prompt */}
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 block">
              Custom Requirements (Optional)
            </label>
            <textarea
              value={customPrompt}
              onChange={e => setCustomPrompt(e.target.value)}
              placeholder="Add specific requirements, game mechanics, or constraints..."
              className="w-full h-24 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-600 resize-none focus:outline-none focus:border-orange-600/50"
            />
          </div>

          {/* Generate Buttons */}
          <div className="space-y-2">
            <button
              onClick={generateDesignFirst}
              disabled={generating || !onAIChat}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-slate-200 flex items-center justify-center gap-2 transition-colors"
            >
              <Lightbulb className="w-4 h-4" />
              Design First
            </button>
            <button
              onClick={generateWithAI}
              disabled={generating}
              className="w-full py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white flex items-center justify-center gap-2 transition-colors"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Code
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Panel - Output */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-slate-500" />
              <span className="text-sm text-slate-400">
                {currentAsset?.label} — {currentEngine?.lang}
                {features.length > 0 && ` • ${features.length} features detected`}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={copyCode}
                disabled={!code}
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                title="Copy Code"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={downloadCode}
                disabled={!code}
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                title="Download File"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={exportAssetPackage}
                disabled={!code}
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                title="Export Asset Package"
              >
                <FileArchive className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-auto bg-slate-950">
            {activeTab === 'generate' && (
              <>
                {code ? (
                  <pre className="p-4 text-sm text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
                    {code}
                  </pre>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-600">
                    <Swords className="w-16 h-16 mb-4 opacity-20" />
                    <p className="text-lg font-medium">Select an engine & asset type</p>
                    <p className="text-sm text-slate-700 mt-2">Click Generate to create production-ready code</p>
                    
                    {/* Quick tips */}
                    <div className="mt-8 grid grid-cols-2 gap-4 max-w-md">
                      <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-800">
                        <Lightbulb className="w-5 h-5 text-orange-400 mb-2" />
                        <p className="text-xs text-slate-400">Use &quot;Design First&quot; to plan before coding</p>
                      </div>
                      <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-800">
                        <CheckSquare className="w-5 h-5 text-green-400 mb-2" />
                        <p className="text-xs text-slate-400">Complexity ratings help estimate effort</p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === 'design' && (
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-orange-400" />
                  Design Document
                </h3>
                
                {features.length > 0 ? (
                  <div className="space-y-4">
                    <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
                      <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">
                        Detected Features
                      </h4>
                      <div className="space-y-2">
                        {features.map((feature, i) => (
                          <div key={i} className="flex items-center gap-3 p-2 bg-slate-800/50 rounded-lg">
                            <CheckSquare className="w-4 h-4 text-green-400" />
                            <div>
                              <div className="text-sm text-slate-200">{feature.name}</div>
                              <div className="text-xs text-slate-500">{feature.description}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <p>No design generated yet.</p>
                    <p className="text-sm mt-2">Click &quot;Design First&quot; to create a structured design document.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'logic' && (
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <GitBranch className="w-5 h-5 text-orange-400" />
                  Logic Flow
                </h3>
                
                {logicMap.length > 0 ? (
                  <div className="space-y-2">
                    {logicMap.map((step, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-orange-600/20 text-orange-400 flex items-center justify-center text-xs font-mono shrink-0">
                          {i + 1}
                        </div>
                        <div className="flex-1 p-3 bg-slate-900 rounded-lg border border-slate-800">
                          <p className="text-sm text-slate-300">{step}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <p>No logic map generated yet.</p>
                    <p className="text-sm mt-2">Use &quot;Design First&quot; to generate a step-by-step logic flow.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPLATE GENERATORS
// ═══════════════════════════════════════════════════════════════════════════════

function generateUnrealCharacterController() {
  return `// CharacterController.h
#pragma once
#include "CoreMinimal.h"
#include "GameFramework/Character.h"
#include "CharacterController.generated.h"

UCLASS()
class AMyCharacter : public ACharacter
{
    GENERATED_BODY()

public:
    AMyCharacter();

    UPROPERTY(EditAnywhere, Category = "Movement")
    float MoveSpeed = 600.f;

    UPROPERTY(EditAnywhere, Category = "Movement")
    float JumpForce = 420.f;

protected:
    virtual void BeginPlay() override;
    virtual void SetupPlayerInputComponent(class UInputComponent* Input) override;

    void MoveForward(float Value);
    void MoveRight(float Value);
    void StartJump();
    void StopJump();
};

// CharacterController.cpp
#include "CharacterController.h"
#include "GameFramework/CharacterMovementComponent.h"

AMyCharacter::AMyCharacter()
{
    GetCharacterMovement()->MaxWalkSpeed = MoveSpeed;
    GetCharacterMovement()->JumpZVelocity = JumpForce;
}

void AMyCharacter::SetupPlayerInputComponent(UInputComponent* Input)
{
    Super::SetupPlayerInputComponent(Input);
    Input->BindAxis("MoveForward", this, &AMyCharacter::MoveForward);
    Input->BindAxis("MoveRight", this, &AMyCharacter::MoveRight);
    Input->BindAction("Jump", IE_Pressed, this, &AMyCharacter::StartJump);
}`;
}

function generateUnrealEnemyAI() {
  return `// EnemyAI.h - Basic patrol and chase behavior
UENUM(BlueprintType)
enum class EEnemyState : uint8 { Idle, Patrol, Chase, Attack };

UCLASS()
class AEnemyAI : public ACharacter
{
    GENERATED_BODY()
public:
    UPROPERTY(EditAnywhere) float DetectRange = 800.f;
    UPROPERTY(EditAnywhere) float AttackRange = 150.f;
    UPROPERTY(BlueprintReadOnly) EEnemyState CurrentState = EEnemyState::Idle;
    
protected:
    virtual void Tick(float DeltaTime) override;
    void UpdateAI();
};`;
}

function generateUnityCharacterController() {
  return `using UnityEngine;

[RequireComponent(typeof(CharacterController))]
public class PlayerController : MonoBehaviour
{
    [Header("Movement")]
    public float moveSpeed = 6f;
    public float jumpHeight = 1.2f;
    
    private CharacterController controller;
    private Vector3 velocity;

    void Start() => controller = GetComponent<CharacterController>();

    void Update()
    {
        // Ground check
        if (controller.isGrounded && velocity.y < 0)
            velocity.y = -2f;

        // Movement
        float x = Input.GetAxis("Horizontal");
        float z = Input.GetAxis("Vertical");
        Vector3 move = transform.right * x + transform.forward * z;
        controller.Move(move * moveSpeed * Time.deltaTime);

        // Jump
        if (Input.GetButtonDown("Jump") && controller.isGrounded)
            velocity.y = Mathf.Sqrt(jumpHeight * -2f * Physics.gravity.y);

        velocity.y += Physics.gravity.y * Time.deltaTime;
        controller.Move(velocity * Time.deltaTime);
    }
}`;
}

function generateUnityEnemyAI() {
  return `using UnityEngine;
using UnityEngine.AI;

[RequireComponent(typeof(NavMeshAgent))]
public class EnemyAI : MonoBehaviour
{
    public float detectRange = 10f;
    public float attackRange = 2f;
    
    private NavMeshAgent agent;
    private Transform player;

    void Start()
    {
        agent = GetComponent<NavMeshAgent>();
        player = GameObject.FindGameObjectWithTag("Player")?.transform;
    }

    void Update()
    {
        if (!player) return;
        
        float dist = Vector3.Distance(transform.position, player.position);
        
        if (dist <= attackRange) Attack();
        else if (dist <= detectRange) Chase();
        else Patrol();
    }

    void Attack() { /* Attack logic */ }
    void Chase() => agent.SetDestination(player.position);
    void Patrol() { /* Patrol logic */ }
}`;
}

function generateGodotCharacterController() {
  return `extends CharacterBody3D

@export var move_speed := 6.0
@export var jump_velocity := 4.5

var gravity = ProjectSettings.get_setting("physics/3d/default_gravity")

func _physics_process(delta):
    # Apply gravity
    if not is_on_floor():
        velocity.y -= gravity * delta

    # Jump
    if Input.is_action_just_pressed("ui_accept") and is_on_floor():
        velocity.y = jump_velocity

    # Movement
    var input_dir = Input.get_vector("move_left", "move_right", "move_forward", "move_back")
    var direction = (transform.basis * Vector3(input_dir.x, 0, input_dir.y)).normalized()
    
    if direction:
        velocity.x = direction.x * move_speed
        velocity.z = direction.z * move_speed
    else:
        velocity.x = move_toward(velocity.x, 0, move_speed)
        velocity.z = move_toward(velocity.z, 0, move_speed)

    move_and_slide()`;
}

function generateGodotEnemyAI() {
  return `extends CharacterBody3D

enum State { IDLE, PATROL, CHASE, ATTACK }

@export var detect_range := 10.0
@export var attack_range := 2.0

var state := State.IDLE
var player: Node3D

func _ready():
    player = get_tree().get_first_node_in_group("player")

func _physics_process(delta):
    if not player: return
    
    var dist = global_position.distance_to(player.global_position)
    
    if dist <= attack_range: state = State.ATTACK
    elif dist <= detect_range: state = State.CHASE
    else: state = State.PATROL
    
    match state:
        State.PATROL: _patrol()
        State.CHASE: _chase()
        State.ATTACK: _attack()

func _chase():
    # Chase logic here
    pass`;
}

function generatePlaceholder(engine, assetType) {
  return `// ${assetType} — ${engine}
// This template will be generated by AI.
// Connect your AI provider in Settings → AI Providers
// to enable automatic code generation for ${engine}.

/*
Asset: ${assetType}
Description: Custom game asset
Provider: Dedicated AI Task Routing (category: 'coding')
*/

// TODO: Implement ${assetType} for ${engine}`;
}

function extractFeaturesFromCode(code) {
  const features = [];
  
  if (code.includes('Move') || code.includes('move')) {
    features.push({ name: 'Movement System', description: 'Character locomotion and physics' });
  }
  if (code.includes('Jump') || code.includes('jump')) {
    features.push({ name: 'Jump Mechanics', description: 'Jumping with gravity and ground detection' });
  }
  if (code.includes('AI') || code.includes('State')) {
    features.push({ name: 'AI State Machine', description: 'Behavioral state management' });
  }
  if (code.includes('Attack') || code.includes('Damage')) {
    features.push({ name: 'Combat System', description: 'Attack and damage handling' });
  }
  if (code.includes('Inventory') || code.includes('Item')) {
    features.push({ name: 'Inventory', description: 'Item collection and management' });
  }
  
  return features;
}

function parseDesignResponse(response) {
  const lines = response.split('\n');
  const logicFlow = [];
  const features = [];
  
  let currentSection = null;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.toLowerCase().includes('logic') || trimmed.toLowerCase().includes('flow')) {
      currentSection = 'logic';
      continue;
    }
    if (trimmed.toLowerCase().includes('feature')) {
      currentSection = 'features';
      continue;
    }
    
    if (trimmed.startsWith('-') || trimmed.startsWith('•') || /^\d+\./.test(trimmed)) {
      const content = trimmed.replace(/^[-•\d.\s]+/, '');
      
      if (currentSection === 'logic' && content) {
        logicFlow.push(content);
      } else if (currentSection === 'features' && content) {
        features.push({ name: content, description: '' });
      }
    }
  }
  
  return { logicFlow, features };
}

// Additional templates (placeholders for brevity)
function generateUnrealInventory() { return '// Unreal Inventory System\n// Full implementation would be here'; }
function generateUnrealCombat() { return '// Unreal Combat System\n// Full implementation would be here'; }
function generateUnityInventory() { return '// Unity Inventory System\n// Full implementation would be here'; }
function generateUnityCombat() { return '// Unity Combat System\n// Full implementation would be here'; }
function generateGodotInventory() { return '// Godot Inventory System\n// Full implementation would be here'; }
function generateGodotCombat() { return '// Godot Combat System\n// Full implementation would be here'; }

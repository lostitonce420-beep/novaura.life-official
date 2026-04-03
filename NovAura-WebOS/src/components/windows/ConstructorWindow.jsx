import React, { useState } from 'react';
import { 
  Wrench, Copy, Download, RefreshCw, FileCode, 
  Gamepad2, Code2, Braces, Hash, FileType, 
  Terminal, Cpu
} from 'lucide-react';

// Web Frameworks
const WEB_FRAMEWORKS = [
  { id: 'react', label: 'React', icon: '⚛️', lang: 'jsx', category: 'web' },
  { id: 'vue', label: 'Vue 3', icon: '💚', lang: 'vue', category: 'web' },
  { id: 'svelte', label: 'Svelte', icon: '🔥', lang: 'svelte', category: 'web' },
  { id: 'vanilla', label: 'Vanilla JS', icon: '📜', lang: 'js', category: 'web' },
  { id: 'typescript', label: 'TypeScript', icon: '🔷', lang: 'ts', category: 'web' },
];

// Game Engines & Languages
const GAME_FRAMEWORKS = [
  { id: 'unity', label: 'Unity (C#)', icon: '🔷', lang: 'cs', category: 'game', engine: 'Unity' },
  { id: 'unreal', label: 'Unreal (C++)', icon: '🎮', lang: 'cpp', category: 'game', engine: 'Unreal' },
  { id: 'godot', label: 'Godot (GDScript)', icon: '🤖', lang: 'gd', category: 'game', engine: 'Godot' },
  { id: 'godot-cpp', label: 'Godot (C++)', icon: '⚙️', lang: 'cpp', category: 'game', engine: 'Godot' },
  { id: 'cpp', label: 'C++', icon: '⚡', lang: 'cpp', category: 'native' },
  { id: 'c', label: 'C', icon: '🔧', lang: 'c', category: 'native' },
  { id: 'csharp', label: 'C#', icon: '#️⃣', lang: 'cs', category: 'native' },
  { id: 'rust', label: 'Rust', icon: '🦀', lang: 'rs', category: 'native' },
];

const ALL_FRAMEWORKS = [...WEB_FRAMEWORKS, ...GAME_FRAMEWORKS];

// Component types by category
const WEB_COMPONENTS = ['button','card','modal','form','navbar','sidebar','table','list','input','dropdown','tabs','accordion','tooltip','badge','avatar','toast','loader','slider','toggle','select'];

const GAME_COMPONENTS = [
  'player-controller',
  'enemy-ai',
  'inventory-system',
  'health-system',
  'damage-system',
  'animation-controller',
  'physics-object',
  'particle-effect',
  'save-load',
  'ui-manager',
  'audio-manager',
  'spawn-system',
  'waypoint-system',
  'dialogue-system',
  'quest-system',
  'loot-table',
  'skill-tree',
  'upgrade-system',
  'minimap',
];

const NATIVE_COMPONENTS = [
  'data-structure',
  'algorithm',
  'memory-manager',
  'file-handler',
  'network-socket',
  'thread-pool',
  'logger',
  'config-parser',
  'event-system',
  'state-machine',
];

// Templates for common patterns
const TEMPLATES = {
  // Unity C#
  unity: {
    'player-controller': `using UnityEngine;

public class PlayerController : MonoBehaviour
{
    [Header("Movement")]
    public float moveSpeed = 5f;
    public float jumpForce = 10f;
    
    [Header("Ground Check")]
    public Transform groundCheck;
    public float groundDistance = 0.4f;
    public LayerMask groundMask;
    
    private Rigidbody rb;
    private bool isGrounded;
    private Vector3 velocity;
    
    void Start()
    {
        rb = GetComponent<Rigidbody>();
    }
    
    void Update()
    {
        // Ground check
        isGrounded = Physics.CheckSphere(groundCheck.position, groundDistance, groundMask);
        
        // Movement
        float x = Input.GetAxis("Horizontal");
        float z = Input.GetAxis("Vertical");
        
        Vector3 move = transform.right * x + transform.forward * z;
        rb.MovePosition(rb.position + move * moveSpeed * Time.deltaTime);
        
        // Jump
        if (Input.GetButtonDown("Jump") && isGrounded)
        {
            rb.AddForce(Vector3.up * jumpForce, ForceMode.Impulse);
        }
    }
}`,
    'enemy-ai': `using UnityEngine;
using UnityEngine.AI;

public class EnemyAI : MonoBehaviour
{
    public Transform player;
    public float detectionRange = 10f;
    public float attackRange = 2f;
    public float moveSpeed = 3f;
    
    private NavMeshAgent agent;
    private Animator animator;
    
    void Start()
    {
        agent = GetComponent<NavMeshAgent>();
        animator = GetComponent<Animator>();
        agent.speed = moveSpeed;
    }
    
    void Update()
    {
        float distance = Vector3.Distance(transform.position, player.position);
        
        if (distance <= detectionRange)
        {
            agent.SetDestination(player.position);
            animator.SetBool("isChasing", true);
            
            if (distance <= attackRange)
            {
                Attack();
            }
        }
        else
        {
            animator.SetBool("isChasing", false);
        }
    }
    
    void Attack()
    {
        animator.SetTrigger("attack");
        // Damage logic here
    }
}`,
  },
  
  // Unreal C++
  unreal: {
    'player-controller': `// PlayerCharacter.h
#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Character.h"
#include "PlayerCharacter.generated.h"

UCLASS()
class MYGAME_API APlayerCharacter : public ACharacter
{
    GENERATED_BODY()
    
public:
    APlayerCharacter();
    
    virtual void Tick(float DeltaTime) override;
    virtual void SetupPlayerInputComponent(UInputComponent* PlayerInputComponent) override;
    
protected:
    virtual void BeginPlay() override;
    
    void MoveForward(float Value);
    void MoveRight(float Value);
    void Jump();
    void StopJumping();
    
    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Movement")
    float WalkSpeed = 600.0f;
    
    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Movement")
    float SprintSpeed = 1000.0f;
};

// PlayerCharacter.cpp
#include "PlayerCharacter.h"

APlayerCharacter::APlayerCharacter()
{
    PrimaryActorTick.bCanEverTick = true;
    GetCharacterMovement()->MaxWalkSpeed = WalkSpeed;
}

void APlayerCharacter::SetupPlayerInputComponent(UInputComponent* PlayerInputComponent)
{
    Super::SetupPlayerInputComponent(PlayerInputComponent);
    
    PlayerInputComponent->BindAxis("MoveForward", this, &APlayerCharacter::MoveForward);
    PlayerInputComponent->BindAxis("MoveRight", this, &APlayerCharacter::MoveRight);
    PlayerInputComponent->BindAction("Jump", IE_Pressed, this, &ACharacter::Jump);
    PlayerInputComponent->BindAction("Jump", IE_Released, this, &ACharacter::StopJumping);
}

void APlayerCharacter::MoveForward(float Value)
{
    if (Controller && Value != 0)
    {
        const FRotator Rotation = Controller->GetControlRotation();
        const FRotator YawRotation(0, Rotation.Yaw, 0);
        const FVector Direction = FRotationMatrix(YawRotation).GetUnitAxis(EAxis::X);
        AddMovementInput(Direction, Value);
    }
}`,
  },
  
  // Godot GDScript
  godot: {
    'player-controller': `extends CharacterBody3D

@export var speed: float = 5.0
@export var jump_velocity: float = 4.5
@export var mouse_sensitivity: float = 0.002

@onready var camera = $Camera3D

var gravity = ProjectSettings.get_setting("physics/3d/default_gravity")

func _ready():
    Input.set_mouse_mode(Input.MOUSE_MODE_CAPTURED)

func _input(event):
    if event is InputEventMouseMotion:
        rotate_y(-event.relative.x * mouse_sensitivity)
        camera.rotate_x(-event.relative.y * mouse_sensitivity)
        camera.rotation.x = clamp(camera.rotation.x, -PI/2, PI/2)

func _physics_process(delta):
    # Gravity
    if not is_on_floor():
        velocity.y -= gravity * delta
    
    # Jump
    if Input.is_action_just_pressed("jump") and is_on_floor():
        velocity.y = jump_velocity
    
    # Movement
    var input_dir = Input.get_vector("left", "right", "forward", "backward")
    var direction = (transform.basis * Vector3(input_dir.x, 0, input_dir.y)).normalized()
    
    if direction:
        velocity.x = direction.x * speed
        velocity.z = direction.z * speed
    else:
        velocity.x = move_toward(velocity.x, 0, speed)
        velocity.z = move_toward(velocity.z, 0, speed)
    
    move_and_slide()`,
  },
  
  // C++
  cpp: {
    'data-structure': `#include <iostream>
#include <vector>
#include <memory>

template<typename T>
class DynamicArray {
private:
    std::unique_ptr<T[]> data;
    size_t capacity;
    size_t length;
    
    void resize(size_t newCapacity) {
        auto newData = std::make_unique<T[]>(newCapacity);
        for (size_t i = 0; i < length; i++) {
            newData[i] = std::move(data[i]);
        }
        data = std::move(newData);
        capacity = newCapacity;
    }
    
public:
    DynamicArray() : capacity(4), length(0) {
        data = std::make_unique<T[]>(capacity);
    }
    
    void push(const T& value) {
        if (length >= capacity) {
            resize(capacity * 2);
        }
        data[length++] = value;
    }
    
    T& operator[](size_t index) {
        return data[index];
    }
    
    size_t size() const { return length; }
    
    void clear() { length = 0; }
};`,
  },
  
  // C
  c: {
    'data-structure': `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
    void* data;
    size_t size;
    size_t capacity;
    size_t elem_size;
} Vector;

Vector* vector_create(size_t elem_size, size_t initial_capacity) {
    Vector* v = malloc(sizeof(Vector));
    v->data = malloc(elem_size * initial_capacity);
    v->size = 0;
    v->capacity = initial_capacity;
    v->elem_size = elem_size;
    return v;
}

void vector_push(Vector* v, void* elem) {
    if (v->size >= v->capacity) {
        v->capacity *= 2;
        v->data = realloc(v->data, v->elem_size * v->capacity);
    }
    memcpy((char*)v->data + (v->size * v->elem_size), elem, v->elem_size);
    v->size++;
}

void* vector_get(Vector* v, size_t index) {
    return (char*)v->data + (index * v->elem_size);
}

void vector_free(Vector* v) {
    free(v->data);
    free(v);
}`,
  },
  
  // React (existing)
  react: {
    button: `import React from 'react';

export default function Button({ children, variant = 'primary', onClick, disabled = false }) {
  const styles = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    outline: 'border border-blue-600 text-blue-600 hover:bg-blue-50',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={\`px-4 py-2 rounded-lg font-medium transition-colors \${styles[variant]} \${disabled ? 'opacity-50 cursor-not-allowed' : ''}\`}
    >
      {children}
    </button>
  );
}`,
  },
};

export default function ConstructorWindow({ onAIChat }) {
  const [framework, setFramework] = useState('react');
  const [componentType, setComponentType] = useState('button');
  const [code, setCode] = useState(TEMPLATES.react?.button || '');
  const [componentName, setComponentName] = useState('Button');
  const [activeTab, setActiveTab] = useState('web');
  const [isGenerating, setIsGenerating] = useState(false);

  const currentFramework = ALL_FRAMEWORKS.find(f => f.id === framework);
  
  const getComponentTypes = () => {
    if (currentFramework?.category === 'game') return GAME_COMPONENTS;
    if (currentFramework?.category === 'native') return NATIVE_COMPONENTS;
    return WEB_COMPONENTS;
  };

  const generateCode = async () => {
    setIsGenerating(true);
    const tmpl = TEMPLATES[framework]?.[componentType];
    
    if (tmpl) {
      setCode(tmpl);
      setComponentName(componentType.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(''));
    } else if (onAIChat) {
      setCode('// Generating with AI...');
      try {
        const isGame = currentFramework?.category === 'game';
        const isNative = currentFramework?.category === 'native';
        
        let prompt = '';
        if (isGame) {
          prompt = `Generate a ${componentType} script for ${currentFramework.engine || framework} using ${currentFramework.lang.toUpperCase()}. 
Include:
- Full class/script with necessary imports
- Public variables/exports for configuration
- Comments explaining key sections
- Best practices for the engine
- Only output the code.`;
        } else if (isNative) {
          prompt = `Generate a ${componentType} implementation in ${currentFramework.lang.toUpperCase()}.
Include:
- Complete working code
- Error handling
- Comments
- Only output the code.`;
        } else {
          prompt = `Generate a ${componentType} component for ${framework}. Use best practices, include props, styling, and export. Only output code.`;
        }
        
        const result = await onAIChat(prompt, isGame ? 'gamedev' : 'coding');
        setCode(result?.response || `// AI returned no response for ${framework}/${componentType}`);
      } catch {
        setCode(`// AI generation failed for ${framework}/${componentType}.\n// Check Settings > AI Providers.`);
      }
      setComponentName(componentType.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(''));
    } else {
      setCode(`// No template for ${framework}/${componentType} yet.\n// Connect an AI provider in Settings to generate.`);
    }
    setIsGenerating(false);
  };

  const copyCode = () => navigator.clipboard.writeText(code);
  
  const downloadCode = () => {
    const ext = currentFramework?.lang || 'txt';
    const blob = new Blob([code], { type: 'text/plain' });
    const link = document.createElement('a');
    link.download = `${componentName}.${ext}`;
    link.href = URL.createObjectURL(blob);
    link.click();
  };

  const handleFrameworkChange = (fwId) => {
    setFramework(fwId);
    const fw = ALL_FRAMEWORKS.find(f => f.id === fwId);
    setActiveTab(fw?.category === 'game' ? 'game' : fw?.category === 'native' ? 'native' : 'web');
    // Reset component type to first available
    const types = fw?.category === 'game' ? GAME_COMPONENTS : fw?.category === 'native' ? NATIVE_COMPONENTS : WEB_COMPONENTS;
    setComponentType(types[0]);
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-blue-900/30 to-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-semibold">Component Constructor</span>
        </div>
        <div className="flex gap-1">
          <button onClick={copyCode} className="p-1.5 rounded text-slate-400 hover:bg-slate-800 hover:text-white" title="Copy">
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button onClick={downloadCode} className="p-1.5 rounded text-slate-400 hover:bg-slate-800 hover:text-white" title="Download">
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Config panel */}
        <div className="w-48 border-r border-slate-800 flex flex-col shrink-0">
          {/* Tabs */}
          <div className="flex border-b border-slate-800">
            <button 
              onClick={() => setActiveTab('web')}
              className={`flex-1 py-2 text-[10px] font-medium flex items-center justify-center gap-1 ${activeTab === 'web' ? 'bg-blue-600/20 text-blue-300 border-b-2 border-blue-500' : 'text-slate-400 hover:bg-slate-800'}`}
            >
              <Code2 className="w-3 h-3" /> Web
            </button>
            <button 
              onClick={() => setActiveTab('game')}
              className={`flex-1 py-2 text-[10px] font-medium flex items-center justify-center gap-1 ${activeTab === 'game' ? 'bg-purple-600/20 text-purple-300 border-b-2 border-purple-500' : 'text-slate-400 hover:bg-slate-800'}`}
            >
              <Gamepad2 className="w-3 h-3" /> Game
            </button>
            <button 
              onClick={() => setActiveTab('native')}
              className={`flex-1 py-2 text-[10px] font-medium flex items-center justify-center gap-1 ${activeTab === 'native' ? 'bg-emerald-600/20 text-emerald-300 border-b-2 border-emerald-500' : 'text-slate-400 hover:bg-slate-800'}`}
            >
              <Cpu className="w-3 h-3" /> Native
            </button>
          </div>

          <div className="p-3 space-y-3 overflow-y-auto flex-1">
            {/* Framework Selection */}
            <div>
              <label className="text-[9px] text-slate-500 block mb-1.5 uppercase tracking-wider">Framework / Language</label>
              <div className="space-y-0.5">
                {ALL_FRAMEWORKS.filter(f => 
                  activeTab === 'web' ? f.category === 'web' :
                  activeTab === 'game' ? f.category === 'game' :
                  f.category === 'native'
                ).map(f => (
                  <button 
                    key={f.id} 
                    onClick={() => handleFrameworkChange(f.id)}
                    className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center gap-2 transition-colors ${
                      framework === f.id ? 'bg-blue-600/30 text-blue-300 border border-blue-600/30' : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <span>{f.icon}</span>
                    <span className="truncate">{f.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Component Selection */}
            <div>
              <label className="text-[9px] text-slate-500 block mb-1.5 uppercase tracking-wider">
                {activeTab === 'game' ? 'Game System' : activeTab === 'native' ? 'Code Module' : 'UI Component'}
              </label>
              <div className="space-y-0.5 max-h-48 overflow-y-auto">
                {getComponentTypes().map(t => (
                  <button 
                    key={t} 
                    onClick={() => setComponentType(t)}
                    className={`w-full text-left px-2 py-1 rounded text-[10px] capitalize transition-colors ${
                      componentType === t ? 'bg-blue-600/30 text-blue-300' : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {t.replace(/-/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Component Name */}
            <div>
              <label className="text-[9px] text-slate-500 block mb-1.5 uppercase tracking-wider">Class/Component Name</label>
              <input 
                value={componentName} 
                onChange={e => setComponentName(e.target.value)}
                className="w-full px-2 py-1.5 bg-black/30 border border-slate-700 rounded text-xs text-white focus:outline-none focus:border-blue-600/50" 
              />
            </div>

            {/* Generate Button */}
            <button 
              onClick={generateCode}
              disabled={isGenerating}
              className="w-full py-2 bg-blue-600/50 hover:bg-blue-500/50 disabled:opacity-50 border border-blue-700 rounded text-xs text-blue-200 flex items-center justify-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} /> 
              {isGenerating ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </div>

        {/* Code output */}
        <div className="flex-1 flex flex-col overflow-hidden bg-black/20">
          <div className="px-3 py-1.5 bg-black/30 border-b border-slate-800/50 shrink-0 flex items-center gap-2">
            <FileCode className="w-3 h-3 text-slate-500" />
            <span className="text-[10px] text-slate-400 font-mono">{componentName}.{currentFramework?.lang || 'txt'}</span>
            <span className="text-[9px] text-slate-600 ml-auto">{code.split('\n').length} lines</span>
          </div>
          <textarea 
            value={code} 
            onChange={e => setCode(e.target.value)}
            className="flex-1 p-3 bg-transparent font-mono text-xs text-slate-200 resize-none focus:outline-none leading-relaxed"
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}

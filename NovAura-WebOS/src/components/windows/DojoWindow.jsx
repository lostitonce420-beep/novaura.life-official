import React, { useState } from 'react';
import { Swords, Copy, Download, Play, Code2, ChevronDown } from 'lucide-react';

const ENGINES = [
  { id: 'unreal', label: 'Unreal Engine', lang: 'C++', ext: '.cpp', icon: '🎮', color: 'text-blue-400' },
  { id: 'unity', label: 'Unity', lang: 'C#', ext: '.cs', icon: '🔷', color: 'text-cyan-400' },
  { id: 'godot', label: 'Godot', lang: 'GDScript', ext: '.gd', icon: '🤖', color: 'text-green-400' },
];

const ASSET_TYPES = [
  { id: 'character-controller', label: 'Character Controller', desc: 'Player movement, jumping, camera' },
  { id: 'enemy-ai', label: 'Enemy AI', desc: 'Patrol, chase, attack behaviors' },
  { id: 'inventory', label: 'Inventory System', desc: 'Item slots, stacking, equipping' },
  { id: 'ui-hud', label: 'UI / HUD', desc: 'Health bar, minimap, score display' },
  { id: 'dialogue', label: 'Dialogue System', desc: 'NPC conversations, branching choices' },
  { id: 'combat', label: 'Combat System', desc: 'Melee/ranged attacks, damage, abilities' },
  { id: 'save-load', label: 'Save / Load', desc: 'Game state persistence and recovery' },
  { id: 'particles', label: 'Particle Effects', desc: 'Fire, smoke, magic, explosions' },
];

const TEMPLATES = {
  'unreal': {
    'character-controller': `// CharacterController.h
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

    UPROPERTY(VisibleAnywhere)
    class USpringArmComponent* CameraBoom;

    UPROPERTY(VisibleAnywhere)
    class UCameraComponent* FollowCamera;

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
#include "GameFramework/SpringArmComponent.h"
#include "Camera/CameraComponent.h"
#include "GameFramework/CharacterMovementComponent.h"

AMyCharacter::AMyCharacter()
{
    PrimaryActorTick.bCanEverTick = true;

    CameraBoom = CreateDefaultSubobject<USpringArmComponent>(TEXT("CameraBoom"));
    CameraBoom->SetupAttachment(RootComponent);
    CameraBoom->TargetArmLength = 300.f;
    CameraBoom->bUsePawnControlRotation = true;

    FollowCamera = CreateDefaultSubobject<UCameraComponent>(TEXT("FollowCamera"));
    FollowCamera->SetupAttachment(CameraBoom, USpringArmComponent::SocketName);

    GetCharacterMovement()->MaxWalkSpeed = MoveSpeed;
    GetCharacterMovement()->JumpZVelocity = JumpForce;
}

void AMyCharacter::BeginPlay() { Super::BeginPlay(); }

void AMyCharacter::SetupPlayerInputComponent(UInputComponent* Input)
{
    Super::SetupPlayerInputComponent(Input);
    Input->BindAxis("MoveForward", this, &AMyCharacter::MoveForward);
    Input->BindAxis("MoveRight", this, &AMyCharacter::MoveRight);
    Input->BindAction("Jump", IE_Pressed, this, &AMyCharacter::StartJump);
    Input->BindAction("Jump", IE_Released, this, &AMyCharacter::StopJump);
}

void AMyCharacter::MoveForward(float Value)
{
    if (Value != 0.f)
    {
        const FRotator YawRotation(0, Controller->GetControlRotation().Yaw, 0);
        const FVector Direction = FRotationMatrix(YawRotation).GetUnitAxis(EAxis::X);
        AddMovementInput(Direction, Value);
    }
}

void AMyCharacter::MoveRight(float Value)
{
    if (Value != 0.f)
    {
        const FRotator YawRotation(0, Controller->GetControlRotation().Yaw, 0);
        const FVector Direction = FRotationMatrix(YawRotation).GetUnitAxis(EAxis::Y);
        AddMovementInput(Direction, Value);
    }
}

void AMyCharacter::StartJump() { Jump(); }
void AMyCharacter::StopJump() { StopJumping(); }`,
    'enemy-ai': `// EnemyAI.h
#pragma once
#include "CoreMinimal.h"
#include "GameFramework/Character.h"
#include "EnemyAI.generated.h"

UENUM(BlueprintType)
enum class EEnemyState : uint8 { Idle, Patrol, Chase, Attack, Dead };

UCLASS()
class AEnemyAI : public ACharacter
{
    GENERATED_BODY()
public:
    AEnemyAI();

    UPROPERTY(EditAnywhere) float DetectRange = 800.f;
    UPROPERTY(EditAnywhere) float AttackRange = 150.f;
    UPROPERTY(EditAnywhere) float PatrolSpeed = 200.f;
    UPROPERTY(EditAnywhere) float ChaseSpeed = 450.f;
    UPROPERTY(EditAnywhere) float Damage = 20.f;
    UPROPERTY(EditAnywhere) float Health = 100.f;

    UPROPERTY(BlueprintReadOnly) EEnemyState CurrentState = EEnemyState::Idle;

    UPROPERTY(EditAnywhere) TArray<FVector> PatrolPoints;

protected:
    virtual void BeginPlay() override;
    virtual void Tick(float DeltaTime) override;

    void UpdateState();
    void Patrol();
    void ChasePlayer();
    void AttackPlayer();
    float TakeDamage(float Dmg, FDamageEvent const& Event, AController* Instigator, AActor* Causer);

    int32 CurrentPatrolIdx = 0;
    float AttackCooldown = 0.f;
    APawn* PlayerRef = nullptr;
};`,
  },
  'unity': {
    'character-controller': `using UnityEngine;

[RequireComponent(typeof(CharacterController))]
public class PlayerController : MonoBehaviour
{
    [Header("Movement")]
    public float moveSpeed = 6f;
    public float sprintMultiplier = 1.5f;
    public float jumpHeight = 1.2f;
    public float gravity = -19.62f;

    [Header("Camera")]
    public Transform cameraTransform;
    public float mouseSensitivity = 2f;
    public float maxLookAngle = 80f;

    private CharacterController controller;
    private Vector3 velocity;
    private float xRotation = 0f;
    private bool isGrounded;

    void Start()
    {
        controller = GetComponent<CharacterController>();
        Cursor.lockState = CursorLockMode.Locked;
    }

    void Update()
    {
        isGrounded = controller.isGrounded;
        if (isGrounded && velocity.y < 0)
            velocity.y = -2f;

        // Mouse look
        float mouseX = Input.GetAxis("Mouse X") * mouseSensitivity;
        float mouseY = Input.GetAxis("Mouse Y") * mouseSensitivity;
        xRotation -= mouseY;
        xRotation = Mathf.Clamp(xRotation, -maxLookAngle, maxLookAngle);
        cameraTransform.localRotation = Quaternion.Euler(xRotation, 0f, 0f);
        transform.Rotate(Vector3.up * mouseX);

        // Movement
        float x = Input.GetAxis("Horizontal");
        float z = Input.GetAxis("Vertical");
        Vector3 move = transform.right * x + transform.forward * z;
        float speed = Input.GetKey(KeyCode.LeftShift) ? moveSpeed * sprintMultiplier : moveSpeed;
        controller.Move(move * speed * Time.deltaTime);

        // Jump
        if (Input.GetButtonDown("Jump") && isGrounded)
            velocity.y = Mathf.Sqrt(jumpHeight * -2f * gravity);

        velocity.y += gravity * Time.deltaTime;
        controller.Move(velocity * Time.deltaTime);
    }
}`,
    'enemy-ai': `using UnityEngine;
using UnityEngine.AI;

public enum EnemyState { Idle, Patrol, Chase, Attack }

[RequireComponent(typeof(NavMeshAgent))]
public class EnemyAI : MonoBehaviour
{
    [Header("Settings")]
    public float detectRange = 10f;
    public float attackRange = 2f;
    public float damage = 20f;
    public float attackCooldown = 1.5f;

    [Header("Patrol")]
    public Transform[] patrolPoints;

    private NavMeshAgent agent;
    private Transform player;
    private EnemyState state = EnemyState.Patrol;
    private int patrolIndex = 0;
    private float lastAttackTime;

    void Start()
    {
        agent = GetComponent<NavMeshAgent>();
        player = GameObject.FindGameObjectWithTag("Player")?.transform;
        if (patrolPoints.Length > 0)
            agent.SetDestination(patrolPoints[0].position);
    }

    void Update()
    {
        float dist = player ? Vector3.Distance(transform.position, player.position) : Mathf.Infinity;

        if (dist <= attackRange) state = EnemyState.Attack;
        else if (dist <= detectRange) state = EnemyState.Chase;
        else state = EnemyState.Patrol;

        switch (state)
        {
            case EnemyState.Patrol: Patrol(); break;
            case EnemyState.Chase: agent.SetDestination(player.position); break;
            case EnemyState.Attack: Attack(); break;
        }
    }

    void Patrol()
    {
        if (patrolPoints.Length == 0) return;
        if (!agent.pathPending && agent.remainingDistance < 0.5f)
        {
            patrolIndex = (patrolIndex + 1) % patrolPoints.Length;
            agent.SetDestination(patrolPoints[patrolIndex].position);
        }
    }

    void Attack()
    {
        agent.SetDestination(transform.position);
        transform.LookAt(new Vector3(player.position.x, transform.position.y, player.position.z));
        if (Time.time - lastAttackTime >= attackCooldown)
        {
            lastAttackTime = Time.time;
            Debug.Log($"Enemy attacks player for {damage} damage!");
        }
    }
}`,
  },
  'godot': {
    'character-controller': `extends CharacterBody3D

@export var move_speed := 6.0
@export var sprint_multiplier := 1.5
@export var jump_velocity := 4.5
@export var mouse_sensitivity := 0.002

var gravity = ProjectSettings.get_setting("physics/3d/default_gravity")

@onready var camera_pivot = $CameraPivot
@onready var camera = $CameraPivot/Camera3D

func _ready():
    Input.set_mouse_mode(Input.MOUSE_MODE_CAPTURED)

func _unhandled_input(event):
    if event is InputEventMouseMotion:
        rotate_y(-event.relative.x * mouse_sensitivity)
        camera_pivot.rotate_x(-event.relative.y * mouse_sensitivity)
        camera_pivot.rotation.x = clamp(camera_pivot.rotation.x, deg_to_rad(-80), deg_to_rad(80))
    if event.is_action_pressed("ui_cancel"):
        Input.set_mouse_mode(Input.MOUSE_MODE_VISIBLE)

func _physics_process(delta):
    if not is_on_floor():
        velocity.y -= gravity * delta

    if Input.is_action_just_pressed("ui_accept") and is_on_floor():
        velocity.y = jump_velocity

    var input_dir = Input.get_vector("move_left", "move_right", "move_forward", "move_back")
    var direction = (transform.basis * Vector3(input_dir.x, 0, input_dir.y)).normalized()
    var speed = move_speed * (sprint_multiplier if Input.is_action_pressed("sprint") else 1.0)

    if direction:
        velocity.x = direction.x * speed
        velocity.z = direction.z * speed
    else:
        velocity.x = move_toward(velocity.x, 0, speed)
        velocity.z = move_toward(velocity.z, 0, speed)

    move_and_slide()`,
    'enemy-ai': `extends CharacterBody3D

enum State { IDLE, PATROL, CHASE, ATTACK }

@export var detect_range := 10.0
@export var attack_range := 2.0
@export var patrol_speed := 3.0
@export var chase_speed := 5.0
@export var damage := 20.0
@export var attack_cooldown := 1.5

@export var patrol_points: Array[Marker3D] = []

var state := State.PATROL
var patrol_index := 0
var last_attack_time := 0.0
var nav_agent: NavigationAgent3D
var player: Node3D

func _ready():
    nav_agent = $NavigationAgent3D
    player = get_tree().get_first_node_in_group("player")
    if patrol_points.size() > 0:
        nav_agent.target_position = patrol_points[0].global_position

func _physics_process(delta):
    var dist = global_position.distance_to(player.global_position) if player else INF

    if dist <= attack_range:
        state = State.ATTACK
    elif dist <= detect_range:
        state = State.CHASE
    else:
        state = State.PATROL

    match state:
        State.PATROL:
            _patrol()
        State.CHASE:
            nav_agent.target_position = player.global_position
            _move(chase_speed, delta)
        State.ATTACK:
            _attack()

func _patrol():
    if patrol_points.size() == 0:
        return
    if nav_agent.is_navigation_finished():
        patrol_index = (patrol_index + 1) % patrol_points.size()
        nav_agent.target_position = patrol_points[patrol_index].global_position
    _move(patrol_speed, get_physics_process_delta_time())

func _move(speed: float, delta: float):
    var next_pos = nav_agent.get_next_path_position()
    var direction = (next_pos - global_position).normalized()
    velocity = direction * speed
    move_and_slide()

func _attack():
    velocity = Vector3.ZERO
    look_at(Vector3(player.global_position.x, global_position.y, player.global_position.z))
    var now = Time.get_ticks_msec() / 1000.0
    if now - last_attack_time >= attack_cooldown:
        last_attack_time = now
        print("Enemy attacks for %d damage!" % damage)`,
  },
};

// Generate a placeholder for templates we don't have
const getPlaceholder = (engine, assetType) => {
  const e = ENGINES.find(x => x.id === engine);
  const a = ASSET_TYPES.find(x => x.id === assetType);
  return `// ${a?.label || 'Asset'} — ${e?.label || 'Engine'}
// Language: ${e?.lang || 'Unknown'}
//
// This template will be generated by AI.
// Connect your AI provider in Settings → AI Providers
// to enable automatic code generation for ${e?.label}.
//
// Asset: ${a?.label}
// Description: ${a?.desc}
//
// TODO: Connect to AI task routing (category: 'coding')`;
};

export default function DojoWindow({ onAIChat }) {
  const [engine, setEngine] = useState('godot');
  const [assetType, setAssetType] = useState('character-controller');
  const [code, setCode] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [generating, setGenerating] = useState(false);

  const currentEngine = ENGINES.find(e => e.id === engine);
  const currentAsset = ASSET_TYPES.find(a => a.id === assetType);

  const generate = async () => {
    // Check for template first
    const template = TEMPLATES[engine]?.[assetType];
    if (template) {
      setCode(template);
      return;
    }

    // Try AI generation
    if (onAIChat) {
      setGenerating(true);
      try {
        const prompt = customPrompt.trim() ||
          `Generate a ${currentAsset.label} for ${currentEngine.label} in ${currentEngine.lang}. ${currentAsset.desc}. Write production-ready code with comments.`;
        const result = await onAIChat(prompt, 'coding');
        setCode(result?.response || getPlaceholder(engine, assetType));
      } catch {
        setCode(getPlaceholder(engine, assetType));
      }
      setGenerating(false);
    } else {
      setCode(getPlaceholder(engine, assetType));
    }
  };

  const copyCode = () => { navigator.clipboard.writeText(code); };
  const downloadCode = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${assetType}${currentEngine.ext}`;
    a.click();
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-orange-900/30 to-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <Swords className="w-4 h-4 text-orange-400" />
          <span className="text-sm font-semibold">Dojo</span>
          <span className="text-[9px] text-slate-500">Game Asset Generator</span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left panel — config */}
        <div className="w-56 border-r border-slate-800 overflow-y-auto p-3 space-y-3 shrink-0">
          {/* Engine */}
          <div>
            <label className="text-[9px] text-slate-500 block mb-1">ENGINE</label>
            <div className="space-y-1">
              {ENGINES.map(e => (
                <button key={e.id} onClick={() => setEngine(e.id)}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs transition-all ${
                    engine === e.id ? 'bg-orange-900/30 border-orange-700 border' : 'bg-slate-900/40 border border-slate-800 hover:border-slate-600'
                  }`}>
                  <span className="text-base">{e.icon}</span>
                  <div>
                    <div className={`font-medium ${engine === e.id ? 'text-orange-300' : 'text-slate-300'}`}>{e.label}</div>
                    <div className="text-[9px] text-slate-500">{e.lang}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Asset type */}
          <div>
            <label className="text-[9px] text-slate-500 block mb-1">ASSET TYPE</label>
            <div className="space-y-0.5">
              {ASSET_TYPES.map(a => (
                <button key={a.id} onClick={() => setAssetType(a.id)}
                  className={`w-full text-left px-2 py-1.5 rounded text-[10px] transition-all ${
                    assetType === a.id ? 'bg-orange-600/20 text-orange-300' : 'text-slate-400 hover:bg-slate-800'
                  }`}>
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom prompt */}
          <div>
            <label className="text-[9px] text-slate-500 block mb-1">CUSTOM PROMPT (optional)</label>
            <textarea value={customPrompt} onChange={e => setCustomPrompt(e.target.value)}
              placeholder="Describe what you need..."
              className="w-full px-2 py-1.5 bg-black/30 border border-slate-700 rounded text-[10px] text-white placeholder-slate-600 resize-none focus:outline-none" rows={3} />
          </div>

          <button onClick={generate} disabled={generating}
            className="w-full py-2 bg-orange-600/50 hover:bg-orange-500/50 border border-orange-700 rounded-lg text-xs text-orange-200 font-medium flex items-center justify-center gap-2 disabled:opacity-40">
            {generating ? 'Generating...' : <><Play className="w-3.5 h-3.5" /> Generate</>}
          </button>
        </div>

        {/* Right panel — code output */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800/50 shrink-0">
            <div className="flex items-center gap-2">
              <Code2 className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-[10px] text-slate-400">{currentAsset?.label} — {currentEngine?.lang}</span>
            </div>
            <div className="flex gap-1">
              <button onClick={copyCode} disabled={!code} className="p-1 text-slate-500 hover:text-white disabled:opacity-30" title="Copy"><Copy className="w-3.5 h-3.5" /></button>
              <button onClick={downloadCode} disabled={!code} className="p-1 text-slate-500 hover:text-white disabled:opacity-30" title="Download"><Download className="w-3.5 h-3.5" /></button>
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            {code ? (
              <pre className="p-3 text-[11px] text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">{code}</pre>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-600">
                <Swords className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-xs">Select an engine & asset type</p>
                <p className="text-[10px] text-slate-700 mt-1">Then hit Generate</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

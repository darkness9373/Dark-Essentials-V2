gamerule sendcommandfeedback false
scoreboard objectives add attack_delay dummy
scoreboard objectives add zephyr_strike dummy
scoreboard objectives add ruby dummy
scoreboard objectives add ruby1 dummy
scoreboard objectives add ruby2 dummy
scoreboard objectives add ruby3 dummy
scoreboard objectives add ruby4 dummy
scoreboard objectives add ruby5 dummy
scoreboard players add @a ruby 0
scoreboard players add @a ruby1 0
scoreboard players add @a ruby2 0
scoreboard players add @a ruby3 0
scoreboard players add @a ruby4 0
scoreboard players add @a ruby5 0
scoreboard players add @a[scores={attack_delay=..120}] attack_delay 1
scoreboard players add @a[tag=vault,scores={zephyr_strike=..120}] zephyr_strike 1
execute at @e[type=custom:damage] as @e[type=custom:damage] run tp ^ ^ ^1 facing ^ ^ ^1000
execute at @e[type=custom:damage] as @e[type=custom:damage] run damage @e[r=2,tag=!r1,tag=!r2,tag=!r3] 7



scoreboard objectives add baelroth1 dummy
scoreboard objectives add baelroth2 dummy
scoreboard objectives add baelroth3 dummy
scoreboard objectives add baelroth4 dummy
scoreboard objectives add baelroth5 dummy


scoreboard objectives add glacivon1 dummy
scoreboard objectives add glacivon2 dummy
scoreboard objectives add glacivon3 dummy
scoreboard objectives add glacivon4 dummy
scoreboard objectives add glacivon5 dummy


scoreboard objectives add grayson1 dummy
scoreboard objectives add grayson2 dummy
scoreboard objectives add grayson3 dummy
scoreboard objectives add grayson4 dummy
scoreboard objectives add grayson5 dummy
scoreboard objectives add graysonpart dummy

scoreboard players add @a[scores={particle_delay=..32}] particle_delay 1
execute at @a[scores={particle_delay=31}] run scoreboard players set @s particle_delay 0
execute as @e[tag=merek] at @s run tp @s ^^^0.07 facing @e[tag=tt]


scoreboard objectives add sistem_shift dummy
scoreboard players add @a[scores={sistem_shift=..120}] sistem_shift 1
scoreboard objectives add sistem_delay dummy
scoreboard players add @a[scores={sistem_delay=..120}] sistem_delay 1
execute at @e[tag=vault] run particle new:baelroth
execute at @e[tag=start_delay] run scoreboard players add @e[tag=start_delay] delay 1

execute at @e[type=drp:baelroth,tag=drop] run loot give @a[r=1,c=1] loot "items/legend/baelroth"
execute at @e[type=drp:baelroth,tag=drop] run execute at @a[r=1,c=1] run event entity @e[type=drp:baelroth,r=1] despawn
execute at @e[type=item,name=" ",c=1] run summon drp:baelroth ^ ^1.5 ^1.5
execute at @e[type=drp:baelroth] run kill @e[type=item,name=" ",c=1]

execute at @e[type=drp:grayson,tag=drop] run loot give @a[r=1,c=1] loot "items/legend/grayson"
execute at @e[type=drp:grayson,tag=drop] run execute at @a[r=1,c=1] run event entity @e[type=drp:grayson,r=1] despawn
execute at @e[type=item,name="§lGrayson Katana",c=1] run summon drp:grayson ^ ^1.5 ^1.5
execute at @e[type=drp:grayson] run kill @e[type=item,name="§lGrayson Katana",c=1]

execute at @e[type=drp:glacivon,tag=drop] run loot give @a[r=1,c=1] loot "items/legend/glacivon"
execute at @e[type=drp:glacivon,tag=drop] run execute at @a[r=1,c=1] run event entity @e[type=drp:glacivon,r=1] despawn
execute at @e[type=item,name="§l§6Glacivon §3Fist",c=1] run summon drp:glacivon ^ ^1.5 ^1.5
execute at @e[type=drp:glacivon] run kill @e[type=item,name="§l§6Glacivon §3Fist",c=1]

execute at @e[type=custom:glacivon_shadow] run particle custom:glacivon_shadow_circle ~ ~ ~

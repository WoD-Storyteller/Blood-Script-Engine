# Rules Source Map (Character Creation + Gameplay Systems)

This map links each rules-source file to the current implementation location.

## Character Creation

- **rules-source/attributes.json** → Attribute storage via XP updates in `XpService.applyMetaToSheet` (stored under `sheet.attributes`).  
- **rules-source/skills.json** → Skill storage via XP updates in `XpService.applyMetaToSheet` (stored under `sheet.skills`).  
- **rules-source/merits.json** → Merit sheet helpers in `MeritsFlawsService.applyMerit` (stored under `sheet.merits`).  
- **rules-source/flaws.json** → Flaw sheet helpers in `MeritsFlawsService.applyFlaw` (stored under `sheet.flaws`).  

## Disciplines + Hunger

- **rules-source/discipline_powers_atomic.json** → Discipline power index placeholder in `DisciplinePowersService` (future lookups).  
- **rules-source/compulsions.json** → Clan compulsion table in `CompulsionsService`.  

## Combat

- **rules-source/combat.json** → Combat exchange resolution in `CombatService.resolveExchange`.  

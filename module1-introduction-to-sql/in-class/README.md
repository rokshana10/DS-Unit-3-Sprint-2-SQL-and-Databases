# 1
SELECT COUNT(character_id) FROM charactercreator_character;
# 2
SELECT COUNT(character_ptr_id) FROM charactercreator_cleric
# 3
SELECT COUNT(character_ptr_id) FROM charactercreator_fighter;
# 4
SELECT COUNT(mage_ptr_id) FROM charactercreator_necromancer;
# 5
SELECT COUNT(character_ptr_id) FROM charactercreator_thief;
# 6
SELECT COUNT(item_id)FROM armory_item;
# 7
SELECT COUNT(item_id)FROM armory_item
SELECT COUNT(item_ptr_id)FROM armory_weapo
SELECT COUNT(item_id)FROM charactercreator_character 
INNER JOIN armory_item 
ON character_id = item_id LIMIT 20;
# 8
SELECT COUNT(item_id)FROM charactercreator_character 
INNER JOIN armory_weapon 
ON character_id = item_id LIMIT 20;

SELECT AVG(item_id)
FROM armory_item
SELECT AVG(item_ptr_id)
FROM armory_weapon

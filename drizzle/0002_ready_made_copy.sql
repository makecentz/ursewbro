UPDATE `site_sections`
SET
  `title` = replace(replace(replace(replace(`title`, 'ONE-OF-A-KIND', 'READY TO WEAR'), 'One-of-a-Kind', 'Ready to Wear'), 'ONE-OF-ONE', 'LIMITED RELEASE'), 'One-of-one', 'Limited release'),
  `subtitle` = replace(replace(replace(replace(`subtitle`, 'ONE-OF-A-KIND', 'READY TO WEAR'), 'One-of-a-Kind', 'Ready to Wear'), 'ONE-OF-ONE', 'LIMITED RELEASE'), 'One-of-one', 'Limited release'),
  `body` = replace(replace(replace(replace(`body`, 'one-of-a-kind', 'ready-to-wear'), 'ONE-OF-A-KIND', 'READY TO WEAR'), 'one-of-one', 'limited-release'), 'One-of-one', 'Limited-release'),
  `updated_at` = unixepoch() * 1000;

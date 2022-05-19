CREATE TABLE `firewall_router_associations` (
  `fw_id` varchar(36) NOT NULL,
  `router_id` varchar(36) NOT NULL,
  PRIMARY KEY (`fw_id`,`router_id`),
  KEY `router_id` (`router_id`),
  CONSTRAINT `firewall_router_associations_ibfk_1` FOREIGN KEY (`fw_id`) REFERENCES `firewalls` (`id`) ON DELETE CASCADE,
  CONSTRAINT `firewall_router_associations_ibfk_2` FOREIGN KEY (`router_id`) REFERENCES `routers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
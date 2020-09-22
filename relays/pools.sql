SELECT
    ph.hash, pmd.url,
    pr.ipv4, pr.ipv6, pr.dns_name, pr.dns_srv_name,
    pu.pledge, pu.margin, pu.fixed_cost
FROM pool_update pu, pool_relay pr, pool_meta_data pmd, pool_hash ph
WHERE
pr.update_id = pu.id AND
pmd.id = pu.meta AND
pu.hash_id = ph.id AND
not EXISTS (select prt.hash_id from pool_retire prt WHERE prt.hash_id = pu.hash_id);

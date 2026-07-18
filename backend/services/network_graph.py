import hashlib
import networkx as nx

class NetworkGraphService:
    def build_network_profile(self, msme_id: str, transactions: list[dict]) -> dict:
        """
        Builds a directed graph of transactions.
        Transactions format: [{"counterparty": str, "direction": "IN" | "OUT", "amount": float, "frequency": int}]
        """
        # Hashing function for anonymity
        def hash_id(name: str) -> str:
            return hashlib.md5(name.encode("utf-8")).hexdigest()[:10]

        G = nx.DiGraph()
        
        # Center node
        center_node = hash_id(msme_id)
        G.add_node(center_node, label="Self", group="center", size=30)
        
        total_inflow = 0.0
        total_outflow = 0.0
        
        in_txs = {}
        out_txs = {}
        
        for tx in transactions:
            cp = tx.get("counterparty", "Unknown")
            direction = tx.get("direction", "IN")
            amount = float(tx.get("amount", 0.0))
            freq = int(tx.get("frequency", 1))
            
            cp_hash = hash_id(cp)
            
            if direction == "IN":
                total_inflow += amount
                in_txs[cp_hash] = in_txs.get(cp_hash, 0.0) + amount
                # Edge from supplier/customer to self
                G.add_node(cp_hash, label=cp[:12] + "..." if len(cp) > 12 else cp, group="customer", size=max(10, min(25, int(amount / 5000) + 8)))
                G.add_edge(cp_hash, center_node, weight=amount, frequency=freq)
            else:
                total_outflow += amount
                out_txs[cp_hash] = out_txs.get(cp_hash, 0.0) + amount
                # Edge from self to supplier
                G.add_node(cp_hash, label=cp[:12] + "..." if len(cp) > 12 else cp, group="supplier", size=max(10, min(25, int(amount / 5000) + 8)))
                G.add_edge(center_node, cp_hash, weight=amount, frequency=freq)

        # Compute concentrations
        customer_concentration = 0.0
        if in_txs and total_inflow > 0:
            top_customer_inflow = max(in_txs.values())
            customer_concentration = top_customer_inflow / total_inflow
            
        supplier_concentration = 0.0
        if out_txs and total_outflow > 0:
            top_supplier_outflow = max(out_txs.values())
            supplier_concentration = top_supplier_outflow / total_outflow
            
        network_resilience_score = 1.0 - max(customer_concentration, supplier_concentration)
        
        # Centrality metrics
        # NetworkX in-degree (for center node: customer diversity)
        # NetworkX out-degree (for center node: supplier diversity)
        try:
            in_deg_cent = nx.in_degree_centrality(G).get(center_node, 0.0)
            out_deg_cent = nx.out_degree_centrality(G).get(center_node, 0.0)
        except Exception:
            # Fallback if centrality fails
            in_deg_cent = len(in_txs) / (len(G.nodes) - 1) if len(G.nodes) > 1 else 0.0
            out_deg_cent = len(out_txs) / (len(G.nodes) - 1) if len(G.nodes) > 1 else 0.0

        # Build node/edge lists for frontend visualization
        nodes_list = []
        for node, data in G.nodes(data=True):
            nodes_list.append({
                "id": node,
                "label": data.get("label", node),
                "group": data.get("group", "other"),
                "size": data.get("size", 10)
            })
            
        edges_list = []
        for u, v, data in G.edges(data=True):
            edges_list.append({
                "source": u,
                "target": v,
                "weight": float(data.get("weight", 1.0)),
                "frequency": int(data.get("frequency", 1))
            })

        return {
            "node_count": len(G.nodes),
            "edge_count": len(G.edges),
            "in_degree_centrality": round(in_deg_cent, 2),
            "out_degree_centrality": round(out_deg_cent, 2),
            "customer_concentration": round(customer_concentration, 3),
            "supplier_concentration": round(supplier_concentration, 3),
            "network_resilience_score": round(network_resilience_score, 2),
            "graph_data": {
                "nodes": nodes_list,
                "links": edges_list
            }
        }

network_graph = NetworkGraphService()

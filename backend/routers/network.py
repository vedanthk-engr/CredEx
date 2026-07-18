from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from backend.database import get_db
from backend.models.msme import MSME
from backend.models.assessment import NetworkSnapshot
from backend.services.network_graph import network_graph
import datetime

router = APIRouter(prefix="/api", tags=["network"])

@router.get("/network/{msme_id}")
async def get_msme_network(msme_id: str, db: AsyncSession = Depends(get_db)):
    """Fetches the supplier and customer payment network graph."""
    # Check MSME
    msme_res = await db.execute(select(MSME).where(MSME.id == msme_id))
    msme = msme_res.scalars().first()
    if not msme:
        raise HTTPException(status_code=404, detail="MSME not found")

    result = await db.execute(
        select(NetworkSnapshot)
        .where(NetworkSnapshot.msme_id == msme_id)
        .order_by(NetworkSnapshot.snapshot_date.desc())
    )
    snapshot = result.scalars().first()

    if not snapshot:
        # Generate one on the fly
        import random
        txs = []
        for i in range(15):
            cp_name = f"Distributor {chr(65+i)}" if i < 5 else f"Customer {100 + i}"
            direction = "OUT" if i < 5 else "IN"
            amt = random.uniform(5000, 50000)
            txs.append({
                "counterparty": cp_name,
                "direction": direction,
                "amount": amt,
                "frequency": random.randint(1, 12)
            })
            
        net_profile = network_graph.build_network_profile(msme_id, txs)
        
        # Save snapshot
        snapshot = NetworkSnapshot(
            msme_id=msme_id,
            snapshot_date=datetime.datetime.utcnow(),
            node_count=net_profile["node_count"],
            edge_count=net_profile["edge_count"],
            in_degree_centrality=net_profile["in_degree_centrality"],
            out_degree_centrality=net_profile["out_degree_centrality"],
            customer_concentration=net_profile["customer_concentration"],
            supplier_concentration=net_profile["supplier_concentration"],
            network_resilience_score=net_profile["network_resilience_score"],
            graph_data=net_profile["graph_data"]
        )
        db.add(snapshot)
        await db.commit()

    return {
        "msme_id": msme_id,
        "node_count": snapshot.node_count,
        "edge_count": snapshot.edge_count,
        "in_degree_centrality": snapshot.in_degree_centrality,
        "out_degree_centrality": snapshot.out_degree_centrality,
        "customer_concentration": snapshot.customer_concentration,
        "supplier_concentration": snapshot.supplier_concentration,
        "network_resilience_score": snapshot.network_resilience_score,
        "graph_data": snapshot.graph_data
    }

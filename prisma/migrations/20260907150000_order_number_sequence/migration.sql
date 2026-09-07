-- Sipariş numarası için ayrı bir sequence.
-- Eşzamanlı iki sipariş aynı numarayı alamasın diye sayaç veritabanında tutuluyor;
-- COUNT(*) + 1 gibi bir yaklaşım yarış koşuluna açık olurdu.
CREATE SEQUENCE IF NOT EXISTS order_no_seq START 1000;

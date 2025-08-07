const Parser = require('rss-parser');
const axios = require('axios');
const cheerio = require('cheerio');

class RSSService {
    constructor() {
        this.parser = new Parser({
            customFields: {
                item: ['media:content', 'media:thumbnail', 'content:encoded', 'description']
            }
        });
        this.rssSources = this.initializeRSSSources();
        this.cache = new Map(); // Simple cache for feeds
        this.cacheTimeout = 15 * 60 * 1000; // 15 minutes
    }

    initializeRSSSources() {
        return [
            // VnExpress - Báo tiếng Việt nhiều người xem nhất
            {
                name: 'VnExpress - Trang chủ',
                url: 'https://vnexpress.net/rss/tin-moi-nhat.rss',
                source: 'VnExpress',
                category: 'home',
                type: 'general'
            },
            {
                name: 'VnExpress - Thời sự',
                url: 'https://vnexpress.net/rss/thoi-su.rss',
                source: 'VnExpress',
                category: 'news',
                type: 'general'
            },
            {
                name: 'VnExpress - Thế giới',
                url: 'https://vnexpress.net/rss/the-gioi.rss',
                source: 'VnExpress',
                category: 'world',
                type: 'international'
            },
            {
                name: 'VnExpress - Kinh doanh',
                url: 'https://vnexpress.net/rss/kinh-doanh.rss',
                source: 'VnExpress',
                category: 'business',
                type: 'business'
            },
            {
                name: 'VnExpress - Startup',
                url: 'https://vnexpress.net/rss/startup.rss',
                source: 'VnExpress',
                category: 'startup',
                type: 'startup'
            },
            {
                name: 'VnExpress - Giải trí',
                url: 'https://vnexpress.net/rss/giai-tri.rss',
                source: 'VnExpress',
                category: 'entertainment',
                type: 'entertainment'
            },
            {
                name: 'VnExpress - Thể thao',
                url: 'https://vnexpress.net/rss/the-thao.rss',
                source: 'VnExpress',
                category: 'sports',
                type: 'sports'
            },
            {
                name: 'VnExpress - Pháp luật',
                url: 'https://vnexpress.net/rss/phap-luat.rss',
                source: 'VnExpress',
                category: 'law',
                type: 'law'
            },
            {
                name: 'VnExpress - Giáo dục',
                url: 'https://vnexpress.net/rss/giao-duc.rss',
                source: 'VnExpress',
                category: 'education',
                type: 'education'
            },
            {
                name: 'VnExpress - Sức khỏe',
                url: 'https://vnexpress.net/rss/suc-khoe.rss',
                source: 'VnExpress',
                category: 'health',
                type: 'health'
            },
            {
                name: 'VnExpress - Đời sống',
                url: 'https://vnexpress.net/rss/gia-dinh.rss',
                source: 'VnExpress',
                category: 'lifestyle',
                type: 'lifestyle'
            },
            {
                name: 'VnExpress - Du lịch',
                url: 'https://vnexpress.net/rss/du-lich.rss',
                source: 'VnExpress',
                category: 'travel',
                type: 'travel'
            },
            {
                name: 'VnExpress - Khoa học công nghệ',
                url: 'https://vnexpress.net/rss/khoa-hoc-cong-nghe.rss',
                source: 'VnExpress',
                category: 'technology',
                type: 'technology'
            },
            {
                name: 'VnExpress - Xe',
                url: 'https://vnexpress.net/rss/oto-xe-may.rss',
                source: 'VnExpress',
                category: 'automotive',
                type: 'automotive'
            },
            {
                name: 'VnExpress - Ý kiến',
                url: 'https://vnexpress.net/rss/y-kien.rss',
                source: 'VnExpress',
                category: 'opinion',
                type: 'opinion'
            },
            {
                name: 'VnExpress - Tâm sự',
                url: 'https://vnexpress.net/rss/tam-su.rss',
                source: 'VnExpress',
                category: 'personal',
                type: 'personal'
            },

            // Tuổi Trẻ - Báo của tuổi trẻ Việt Nam  
            {
                name: 'Tuổi Trẻ - Trang chủ',
                url: 'https://tuoitre.vn/rss/tin-moi-nhat.rss',
                source: 'Tuổi Trẻ',
                category: 'home',
                type: 'general'
            },
            {
                name: 'Tuổi Trẻ - Thời sự',
                url: 'https://tuoitre.vn/rss/thoi-su.rss',
                source: 'Tuổi Trẻ',
                category: 'news',
                type: 'general'
            },
            {
                name: 'Tuổi Trẻ - Thế giới',
                url: 'https://tuoitre.vn/rss/the-gioi.rss',
                source: 'Tuổi Trẻ',
                category: 'world',
                type: 'international'
            },
            {
                name: 'Tuổi Trẻ - Pháp luật',
                url: 'https://tuoitre.vn/rss/phap-luat.rss',
                source: 'Tuổi Trẻ',
                category: 'law',
                type: 'law'
            },
            {
                name: 'Tuổi Trẻ - Kinh doanh',
                url: 'https://tuoitre.vn/rss/kinh-doanh.rss',
                source: 'Tuổi Trẻ',
                category: 'business',
                type: 'business'
            },
            {
                name: 'Tuổi Trẻ - Công nghệ',
                url: 'https://tuoitre.vn/rss/nhip-song-so.rss',
                source: 'Tuổi Trẻ',
                category: 'technology',
                type: 'technology'
            },
            {
                name: 'Tuổi Trẻ - Xe',
                url: 'https://tuoitre.vn/rss/xe.rss',
                source: 'Tuổi Trẻ',
                category: 'automotive',
                type: 'automotive'
            },
            {
                name: 'Tuổi Trẻ - Văn hóa',
                url: 'https://tuoitre.vn/rss/van-hoa.rss',
                source: 'Tuổi Trẻ',
                category: 'culture',
                type: 'culture'
            },
            {
                name: 'Tuổi Trẻ - Giải trí',
                url: 'https://tuoitre.vn/rss/giai-tri.rss',
                source: 'Tuổi Trẻ',
                category: 'entertainment',
                type: 'entertainment'
            },
            {
                name: 'Tuổi Trẻ - Thể thao',
                url: 'https://tuoitre.vn/rss/the-thao.rss',
                source: 'Tuổi Trẻ',
                category: 'sports',
                type: 'sports'
            },
            {
                name: 'Tuổi Trẻ - Giáo dục',
                url: 'https://tuoitre.vn/rss/giao-duc.rss',
                source: 'Tuổi Trẻ',
                category: 'education',
                type: 'education'
            },
            {
                name: 'Tuổi Trẻ - Khoa học',
                url: 'https://tuoitre.vn/rss/khoa-hoc.rss',
                source: 'Tuổi Trẻ',
                category: 'science',
                type: 'science'
            },
            {
                name: 'Tuổi Trẻ - Sức khỏe',
                url: 'https://tuoitre.vn/rss/suc-khoe.rss',
                source: 'Tuổi Trẻ',
                category: 'health',
                type: 'health'
            },
            {
                name: 'Tuổi Trẻ - Nhịp sống trẻ',
                url: 'https://tuoitre.vn/rss/nhip-song-tre.rss',
                source: 'Tuổi Trẻ',
                category: 'lifestyle',
                type: 'lifestyle'
            },
            {
                name: 'Tuổi Trẻ - Du lịch',
                url: 'https://tuoitre.vn/rss/du-lich.rss',
                source: 'Tuổi Trẻ',
                category: 'travel',
                type: 'travel'
            },

            // Thanh Niên - Cập nhật mới từ RSS page
            {
                name: 'Thanh Niên - Trang chủ',
                url: 'https://thanhnien.vn/rss/home.rss',
                source: 'Thanh Niên',
                category: 'home',
                type: 'general'
            },
            {
                name: 'Thanh Niên - Thời sự',
                url: 'https://thanhnien.vn/rss/thoi-su.rss',
                source: 'Thanh Niên',
                category: 'news',
                type: 'general'
            },
            {
                name: 'Thanh Niên - Chính trị',
                url: 'https://thanhnien.vn/rss/chinh-tri.rss',
                source: 'Thanh Niên',
                category: 'politics',
                type: 'politics'
            },
            {
                name: 'Thanh Niên - Thế giới',
                url: 'https://thanhnien.vn/rss/the-gioi.rss',
                source: 'Thanh Niên',
                category: 'world',
                type: 'international'
            },
            {
                name: 'Thanh Niên - Kinh tế',
                url: 'https://thanhnien.vn/rss/kinh-te.rss',
                source: 'Thanh Niên',
                category: 'economy',
                type: 'economy'
            },
            {
                name: 'Thanh Niên - Đời sống',
                url: 'https://thanhnien.vn/rss/doi-song.rss',
                source: 'Thanh Niên',
                category: 'lifestyle',
                type: 'lifestyle'
            },
            {
                name: 'Thanh Niên - Sức khỏe',
                url: 'https://thanhnien.vn/rss/suc-khoe.rss',
                source: 'Thanh Niên',
                category: 'health',
                type: 'health'
            },
            {
                name: 'Thanh Niên - Giới trẻ',
                url: 'https://thanhnien.vn/rss/gioi-tre.rss',
                source: 'Thanh Niên',
                category: 'youth',
                type: 'youth'
            },
            {
                name: 'Thanh Niên - Giáo dục',
                url: 'https://thanhnien.vn/rss/giao-duc.rss',
                source: 'Thanh Niên',
                category: 'education',
                type: 'education'
            },
            {
                name: 'Thanh Niên - Du lịch',
                url: 'https://thanhnien.vn/rss/du-lich.rss',
                source: 'Thanh Niên',
                category: 'travel',
                type: 'travel'
            },
            {
                name: 'Thanh Niên - Văn hóa',
                url: 'https://thanhnien.vn/rss/van-hoa.rss',
                source: 'Thanh Niên',
                category: 'culture',
                type: 'culture'
            },
            {
                name: 'Thanh Niên - Giải trí',
                url: 'https://thanhnien.vn/rss/giai-tri.rss',
                source: 'Thanh Niên',
                category: 'entertainment',
                type: 'entertainment'
            },
            {
                name: 'Thanh Niên - Thể thao',
                url: 'https://thanhnien.vn/rss/the-thao.rss',
                source: 'Thanh Niên',
                category: 'sports',
                type: 'sports'
            },
            {
                name: 'Thanh Niên - Công nghệ',
                url: 'https://thanhnien.vn/rss/cong-nghe.rss',
                source: 'Thanh Niên',
                category: 'technology',
                type: 'technology'
            },
            {
                name: 'Thanh Niên - Xe',
                url: 'https://thanhnien.vn/rss/xe.rss',
                source: 'Thanh Niên',
                category: 'automotive',
                type: 'automotive'
            },

            // Dân Trí - Comprehensive RSS feeds
            {
                name: 'Dân Trí - Trang chủ',
                url: 'https://dantri.com.vn/rss/home.rss',
                source: 'Dân Trí',
                category: 'home',
                type: 'general'
            },
            {
                name: 'Dân Trí - Sự kiện',
                url: 'https://dantri.com.vn/rss/su-kien.rss',
                source: 'Dân Trí',
                category: 'news',
                type: 'general'
            },
            {
                name: 'Dân Trí - Xã hội',
                url: 'https://dantri.com.vn/rss/xa-hoi.rss',
                source: 'Dân Trí',
                category: 'society',
                type: 'society'
            },
            {
                name: 'Dân Trí - Thế giới',
                url: 'https://dantri.com.vn/rss/the-gioi.rss',
                source: 'Dân Trí',
                category: 'world',
                type: 'international'
            },
            {
                name: 'Dân Trí - Kinh doanh',
                url: 'https://dantri.com.vn/rss/kinh-doanh.rss',
                source: 'Dân Trí',
                category: 'business',
                type: 'business'
            },
            {
                name: 'Dân Trí - Bất động sản',
                url: 'https://dantri.com.vn/rss/bat-dong-san.rss',
                source: 'Dân Trí',
                category: 'realestate',
                type: 'realestate'
            },
            {
                name: 'Dân Trí - Giải trí',
                url: 'https://dantri.com.vn/rss/giai-tri.rss',
                source: 'Dân Trí',
                category: 'entertainment',
                type: 'entertainment'
            },
            {
                name: 'Dân Trí - Thể thao',
                url: 'https://dantri.com.vn/rss/the-thao.rss',
                source: 'Dân Trí',
                category: 'sports',
                type: 'sports'
            },
            {
                name: 'Dân Trí - Giáo dục',
                url: 'https://dantri.com.vn/rss/giao-duc.rss',
                source: 'Dân Trí',
                category: 'education',
                type: 'education'
            },
            {
                name: 'Dân Trí - Sức khỏe',
                url: 'https://dantri.com.vn/rss/suc-khoe.rss',
                source: 'Dân Trí',
                category: 'health',
                type: 'health'
            },
            {
                name: 'Dân Trí - Công nghệ',
                url: 'https://dantri.com.vn/rss/cong-nghe.rss',
                source: 'Dân Trí',
                category: 'technology',
                type: 'technology'
            },
            {
                name: 'Dân Trí - Ô tô - Xe máy',
                url: 'https://dantri.com.vn/rss/o-to-xe-may.rss',
                source: 'Dân Trí',
                category: 'automotive',
                type: 'automotive'
            },
            {
                name: 'Dân Trí - Pháp luật',
                url: 'https://dantri.com.vn/rss/phap-luat.rss',
                source: 'Dân Trí',
                category: 'law',
                type: 'law'
            },
            {
                name: 'Dân Trí - Du lịch',
                url: 'https://dantri.com.vn/rss/du-lich.rss',
                source: 'Dân Trí',
                category: 'travel',
                type: 'travel'
            },
            {
                name: 'Dân Trí - Khoa học',
                url: 'https://dantri.com.vn/rss/khoa-hoc.rss',
                source: 'Dân Trí',
                category: 'science',
                type: 'science'
            },

            // VietNamNet RSS feeds
            {
                name: 'VietNamNet - Trang nhất',
                url: 'https://vietnamnet.vn/rss/index.rss',
                source: 'VietNamNet',
                category: 'home',
                type: 'general'
            },
            {
                name: 'VietNamNet - Tin nhanh',
                url: 'https://vietnamnet.vn/tinnhanh/index.rss',
                source: 'VietNamNet',
                category: 'news',
                type: 'general'
            },
            {
                name: 'VietNamNet - CNTT - Viễn thông',
                url: 'https://vietnamnet.vn/cntt/index.rss',
                source: 'VietNamNet',
                category: 'technology',
                type: 'technology'
            },
            {
                name: 'VietNamNet - Phóng sự điều tra',
                url: 'https://vietnamnet.vn/psks/index.rss',
                source: 'VietNamNet',
                category: 'investigation',
                type: 'investigation'
            },
            {
                name: 'VietNamNet - Kinh tế - Thị trường',
                url: 'https://vietnamnet.vn/kinhte/index.rss',
                source: 'VietNamNet',
                category: 'economy',
                type: 'economy'
            },
            {
                name: 'VietNamNet - Văn hóa',
                url: 'https://vietnamnet.vn/vanhoa/index.rss',
                source: 'VietNamNet',
                category: 'culture',
                type: 'culture'
            },
            {
                name: 'VietNamNet - Quốc tế',
                url: 'https://vietnamnet.vn/thegioi/index.rss',
                source: 'VietNamNet',
                category: 'world',
                type: 'international'
            },
            {
                name: 'VietNamNet - Khoa học',
                url: 'https://vietnamnet.vn/khoahoc/index.rss',
                source: 'VietNamNet',
                category: 'science',
                type: 'science'
            },
            {
                name: 'VietNamNet - Giáo dục',
                url: 'https://vietnamnet.vn/giaoduc/index.rss',
                source: 'VietNamNet',
                category: 'education',
                type: 'education'
            },
            {
                name: 'VietNamNet - Chính trị',
                url: 'https://vietnamnet.vn/chinhtri/index.rss',
                source: 'VietNamNet',
                category: 'politics',
                type: 'politics'
            },

            // Báo Người Lao Động - Comprehensive RSS feeds
            {
                name: 'Người Lao Động - Trang chủ',
                url: 'https://nld.com.vn/rss/home.rss',
                source: 'Người Lao Động',
                category: 'home',
                type: 'general'
            },
            {
                name: 'Người Lao Động - Thời sự',
                url: 'https://nld.com.vn/rss/thoi-su.rss',
                source: 'Người Lao Động',
                category: 'news',
                type: 'general'
            },
            {
                name: 'Người Lao Động - Quốc tế',
                url: 'https://nld.com.vn/rss/quoc-te.rss',
                source: 'Người Lao Động',
                category: 'world',
                type: 'international'
            },
            {
                name: 'Người Lao Động - Lao động',
                url: 'https://nld.com.vn/rss/lao-dong.rss',
                source: 'Người Lao Động',
                category: 'job',
                type: 'job'
            },
            {
                name: 'Người Lao Động - Kinh tế',
                url: 'https://nld.com.vn/rss/kinh-te.rss',
                source: 'Người Lao Động',
                category: 'economy',
                type: 'economy'
            },
            {
                name: 'Người Lao Động - Sức khỏe',
                url: 'https://nld.com.vn/rss/suc-khoe.rss',
                source: 'Người Lao Động',
                category: 'health',
                type: 'health'
            },
            {
                name: 'Người Lao Động - Giáo dục',
                url: 'https://nld.com.vn/rss/giao-duc-khoa-hoc.rss',
                source: 'Người Lao Động',
                category: 'education',
                type: 'education'
            },
            {
                name: 'Người Lao Động - Pháp luật',
                url: 'https://nld.com.vn/rss/phap-luat.rss',
                source: 'Người Lao Động',
                category: 'law',
                type: 'law'
            },
            {
                name: 'Người Lao Động - Văn hóa - Văn nghệ',
                url: 'https://nld.com.vn/rss/van-hoa-van-nghe.rss',
                source: 'Người Lao Động',
                category: 'culture',
                type: 'culture'
            },
            {
                name: 'Người Lao Động - Giải trí',
                url: 'https://nld.com.vn/rss/giai-tri.rss',
                source: 'Người Lao Động',
                category: 'entertainment',
                type: 'entertainment'
            },
            {
                name: 'Người Lao Động - Thể thao',
                url: 'https://nld.com.vn/rss/the-thao.rss',
                source: 'Người Lao Động',
                category: 'sports',
                type: 'sports'
            },
            {
                name: 'Người Lao Động - Du lịch xanh',
                url: 'https://nld.com.vn/rss/du-lich-xanh.rss',
                source: 'Người Lao Động',
                category: 'travel',
                type: 'travel'
            },
            {
                name: 'Người Lao Động - Phụ nữ',
                url: 'https://nld.com.vn/rss/chuyen-trang-phu-nu.rss',
                source: 'Người Lao Động',
                category: 'women',
                type: 'women'
            },
            {
                name: 'Người Lao Động - Gia đình',
                url: 'https://nld.com.vn/rss/gia-dinh.rss',
                source: 'Người Lao Động',
                category: 'family',
                type: 'family'
            },
            {
                name: 'Người Lao Động - Địa ốc',
                url: 'https://nld.com.vn/rss/dia-oc.rss',
                source: 'Người Lao Động',
                category: 'realestate',
                type: 'realestate'
            },

            // VietTimes RSS feeds
            {
                name: 'VietTimes - Trang chủ',
                url: 'https://viettimes.vn/rss/home.rss',
                source: 'VietTimes',
                category: 'home',
                type: 'general'
            },
            {
                name: 'VietTimes - Kinh tế - Dữ liệu',
                url: 'https://viettimes.vn/rss/kinh-te-du-lieu-3.rss',
                source: 'VietTimes',
                category: 'economy',
                type: 'economy'
            },
            {
                name: 'VietTimes - Bất động sản',
                url: 'https://viettimes.vn/rss/bat-dong-san-186.rss',
                source: 'VietTimes',
                category: 'realestate',
                type: 'realestate'
            },
            {
                name: 'VietTimes - Xã hội',
                url: 'https://viettimes.vn/rss/xa-hoi-su-kien-7.rss',
                source: 'VietTimes',
                category: 'society',
                type: 'society'
            },
            {
                name: 'VietTimes - Y tế',
                url: 'https://viettimes.vn/rss/xa-hoi/y-te-120.rss',
                source: 'VietTimes',
                category: 'health',
                type: 'health'
            },
            {
                name: 'VietTimes - Giáo dục',
                url: 'https://viettimes.vn/rss/xa-hoi/giao-duc-169.rss',
                source: 'VietTimes',
                category: 'education',
                type: 'education'
            },
            {
                name: 'VietTimes - Pháp luật',
                url: 'https://viettimes.vn/rss/phap-luat-187.rss',
                source: 'VietTimes',
                category: 'law',
                type: 'law'
            },
            {
                name: 'VietTimes - Khoa học - Công nghệ',
                url: 'https://viettimes.vn/rss/khoa-hoc-cong-nghe-109.rss',
                source: 'VietTimes',
                category: 'technology',
                type: 'technology'
            },
            {
                name: 'VietTimes - Xe',
                url: 'https://viettimes.vn/rss/oto-xe-may-110.rss',
                source: 'VietTimes',
                category: 'automotive',
                type: 'automotive'
            },
            {
                name: 'VietTimes - Thế giới',
                url: 'https://viettimes.vn/rss/the-gioi-121.rss',
                source: 'VietTimes',
                category: 'world',
                type: 'international'
            },

            // Báo Tổ Quốc RSS feeds
            {
                name: 'Tổ Quốc - Trang chủ',
                url: 'https://toquoc.vn/rss/home.rss',
                source: 'Tổ Quốc',
                category: 'home',
                type: 'general'
            },
            {
                name: 'Tổ Quốc - Thời sự',
                url: 'https://toquoc.vn/rss/thoi-su-1.rss',
                source: 'Tổ Quốc',
                category: 'news',
                type: 'general'
            },
            {
                name: 'Tổ Quốc - Văn hóa',
                url: 'https://toquoc.vn/rss/van-hoa-10.rss',
                source: 'Tổ Quốc',
                category: 'culture',
                type: 'culture'
            },
            {
                name: 'Tổ Quốc - Thể thao',
                url: 'https://toquoc.vn/rss/the-thao-15.rss',
                source: 'Tổ Quốc',
                category: 'sports',
                type: 'sports'
            },
            {
                name: 'Tổ Quốc - Du lịch',
                url: 'https://toquoc.vn/rss/du-lich-18.rss',
                source: 'Tổ Quốc',
                category: 'travel',
                type: 'travel'
            },
            {
                name: 'Tổ Quốc - Thế giới',
                url: 'https://toquoc.vn/rss/the-gioi-5.rss',
                source: 'Tổ Quốc',
                category: 'world',
                type: 'international'
            },
            {
                name: 'Tổ Quốc - Kinh tế',
                url: 'https://toquoc.vn/rss/kinh-te-2.rss',
                source: 'Tổ Quốc',
                category: 'economy',
                type: 'economy'
            },
            {
                name: 'Tổ Quốc - Giải trí',
                url: 'https://toquoc.vn/rss/giai-tri-11.rss',
                source: 'Tổ Quốc',
                category: 'entertainment',
                type: 'entertainment'
            },
            {
                name: 'Tổ Quốc - Giáo dục',
                url: 'https://toquoc.vn/rss/giao-duc-78.rss',
                source: 'Tổ Quốc',
                category: 'education',
                type: 'education'
            },
            {
                name: 'Tổ Quốc - Sức khỏe',
                url: 'https://toquoc.vn/rss/suc-khoe-25.rss',
                source: 'Tổ Quốc',
                category: 'health',
                type: 'health'
            },

            // Báo Quân đội nhân dân RSS feeds
            {
                name: 'Quân đội nhân dân - Trang chủ',
                url: 'https://www.qdnd.vn/rss/cate/tin-tuc-moi-nhat.rss',
                source: 'Quân đội nhân dân',
                category: 'home',
                type: 'general'
            },
            {
                name: 'Quân đội nhân dân - Chính trị',
                url: 'https://www.qdnd.vn/rss/cate/chinh-tri-3429.rss',
                source: 'Quân đội nhân dân',
                category: 'politics',
                type: 'politics'
            },
            {
                name: 'Quân đội nhân dân - Quốc phòng - An ninh',
                url: 'https://www.qdnd.vn/rss/cate/quoc-phong-an-ninh-3424.rss',
                source: 'Quân đội nhân dân',
                category: 'defense',
                type: 'defense'
            },
            {
                name: 'Quân đội nhân dân - Kinh tế',
                url: 'https://www.qdnd.vn/rss/cate/kinh-te-3438.rss',
                source: 'Quân đội nhân dân',
                category: 'economy',
                type: 'economy'
            },
            {
                name: 'Quân đội nhân dân - Xã hội',
                url: 'https://www.qdnd.vn/rss/cate/xa-hoi-3442.rss',
                source: 'Quân đội nhân dân',
                category: 'society',
                type: 'society'
            },
            {
                name: 'Quân đội nhân dân - Quốc tế',
                url: 'https://www.qdnd.vn/rss/cate/quoc-te-3447.rss',
                source: 'Quân đội nhân dân',
                category: 'world',
                type: 'international'
            },
            {
                name: 'Quân đội nhân dân - Văn hóa',
                url: 'https://www.qdnd.vn/rss/cate/van-hoa-3451.rss',
                source: 'Quân đội nhân dân',
                category: 'culture',
                type: 'culture'
            },
            {
                name: 'Quân đội nhân dân - Thể thao',
                url: 'https://www.qdnd.vn/rss/cate/the-thao-3455.rss',
                source: 'Quân đội nhân dân',
                category: 'sports',
                type: 'sports'
            },
            {
                name: 'Quân đội nhân dân - Pháp luật',
                url: 'https://www.qdnd.vn/rss/cate/phap-luat-3543.rss',
                source: 'Quân đội nhân dân',
                category: 'law',
                type: 'law'
            },

            // VTC News RSS feeds
            {
                name: 'VTC News - Trang chủ',
                url: 'https://vtcnews.vn/rss/feed.rss',
                source: 'VTC News',
                category: 'home',
                type: 'general'
            },
            {
                name: 'VTC News - Thời sự',
                url: 'https://vtcnews.vn/rss/thoi-su.rss',
                source: 'VTC News',
                category: 'news',
                type: 'general'
            },
            {
                name: 'VTC News - Kinh tế',
                url: 'https://vtcnews.vn/rss/kinh-te.rss',
                source: 'VTC News',
                category: 'economy',
                type: 'economy'
            },
            {
                name: 'VTC News - Thế giới',
                url: 'https://vtcnews.vn/rss/the-gioi.rss',
                source: 'VTC News',
                category: 'world',
                type: 'international'
            },
            {
                name: 'VTC News - Giáo dục',
                url: 'https://vtcnews.vn/rss/giao-duc.rss',
                source: 'VTC News',
                category: 'education',
                type: 'education'
            },
            {
                name: 'VTC News - Pháp luật',
                url: 'https://vtcnews.vn/rss/phap-luat.rss',
                source: 'VTC News',
                category: 'law',
                type: 'law'
            },
            {
                name: 'VTC News - Sức khỏe',
                url: 'https://vtcnews.vn/rss/suc-khoe.rss',
                source: 'VTC News',
                category: 'health',
                type: 'health'
            },
            {
                name: 'VTC News - Xe',
                url: 'https://vtcnews.vn/rss/oto-xe-may.rss',
                source: 'VTC News',
                category: 'automotive',
                type: 'automotive'
            },
            {
                name: 'VTC News - Khoa học - Công nghệ',
                url: 'https://vtcnews.vn/rss/khoa-hoc-cong-nghe.rss',
                source: 'VTC News',
                category: 'technology',
                type: 'technology'
            },
            {
                name: 'VTC News - Văn hóa - Giải trí',
                url: 'https://vtcnews.vn/rss/van-hoa-giai-tri.rss',
                source: 'VTC News',
                category: 'entertainment',
                type: 'entertainment'
            },
            {
                name: 'VTC News - Thể thao',
                url: 'https://vtcnews.vn/rss/the-thao.rss',
                source: 'VTC News',
                category: 'sports',
                type: 'sports'
            },

            // VTV RSS feeds
            {
                name: 'VTV - Trang chủ',
                url: 'https://vtv.vn/rss/home.rss',
                source: 'VTV',
                category: 'home',
                type: 'general'
            },
            {
                name: 'VTV - Chính trị',
                url: 'https://vtv.vn/rss/chinh-tri.rss',
                source: 'VTV',
                category: 'politics',
                type: 'politics'
            },
            {
                name: 'VTV - Xã hội',
                url: 'https://vtv.vn/rss/xa-hoi.rss',
                source: 'VTV',
                category: 'society',
                type: 'society'
            },
            {
                name: 'VTV - Pháp luật',
                url: 'https://vtv.vn/rss/phap-luat.rss',
                source: 'VTV',
                category: 'law',
                type: 'law'
            },
            {
                name: 'VTV - Thế giới',
                url: 'https://vtv.vn/rss/the-gioi.rss',
                source: 'VTV',
                category: 'world',
                type: 'international'
            },
            {
                name: 'VTV - Kinh tế',
                url: 'https://vtv.vn/rss/kinh-te.rss',
                source: 'VTV',
                category: 'economy',
                type: 'economy'
            },
            {
                name: 'VTV - Văn hóa - Giải trí',
                url: 'https://vtv.vn/rss/van-hoa-giai-tri.rss',
                source: 'VTV',
                category: 'entertainment',
                type: 'entertainment'
            },
            {
                name: 'VTV - Công nghệ',
                url: 'https://vtv.vn/rss/cong-nghe.rss',
                source: 'VTV',
                category: 'technology',
                type: 'technology'
            },
            {
                name: 'VTV - Giáo dục',
                url: 'https://vtv.vn/rss/giao-duc.rss',
                source: 'VTV',
                category: 'education',
                type: 'education'
            },
            {
                name: 'VTV - Y tế',
                url: 'https://vtv.vn/rss/y-te.rss',
                source: 'VTV',
                category: 'health',
                type: 'health'
            },

            // Báo Tin Tức (Thông tấn xã Việt Nam) - Already included with corrections
            {
                name: 'Báo Tin Tức - Trang chủ',
                url: 'https://baotintuc.vn/rss/home.rss',
                source: 'Báo Tin Tức',
                category: 'home',
                type: 'general'
            },
            {
                name: 'Báo Tin Tức - Xã hội',
                url: 'https://baotintuc.vn/rss/xa-hoi.rss',
                source: 'Báo Tin Tức',
                category: 'society',
                type: 'society'
            },
            {
                name: 'Báo Tin Tức - Chân dung',
                url: 'https://baotintuc.vn/rss/chan-dung.rss',
                source: 'Báo Tin Tức',
                category: 'profile',
                type: 'profile'
            },
            {
                name: 'Báo Tin Tức - Quân sự',
                url: 'https://baotintuc.vn/rss/quan-su.rss',
                source: 'Báo Tin Tức',
                category: 'military',
                type: 'military'
            },
            {
                name: 'Báo Tin Tức - Biển đảo',
                url: 'https://baotintuc.vn/rss/bien-dao.rss',
                source: 'Báo Tin Tức',
                category: 'islands',
                type: 'islands'
            },
            {
                name: 'Báo Tin Tức - Địa phương',
                url: 'https://baotintuc.vn/rss/dia-phuong.rss',
                source: 'Báo Tin Tức',
                category: 'local',
                type: 'local'
            },
            {
                name: 'Báo Tin Tức - Góc nhìn',
                url: 'https://baotintuc.vn/rss/goc-nhin.rss',
                source: 'Báo Tin Tức',
                category: 'perspective',
                type: 'perspective'
            },
            {
                name: 'Báo Tin Tức - Ảnh',
                url: 'https://baotintuc.vn/rss/anh.rss',
                source: 'Báo Tin Tức',
                category: 'photo',
                type: 'photo'
            },
            {
                name: 'Báo Tin Tức - Infographic',
                url: 'https://baotintuc.vn/rss/infographic.rss',
                source: 'Báo Tin Tức',
                category: 'infographics',
                type: 'infographics'
            },
            {
                name: 'Báo Tin Tức - Chuyên đề',
                url: 'https://baotintuc.vn/rss/chuyen-de.rss',
                source: 'Báo Tin Tức',
                category: 'special',
                type: 'special'
            },
            {
                name: 'Báo Tin Tức - Dân tộc',
                url: 'https://baotintuc.vn/rss/dan-toc.rss',
                source: 'Báo Tin Tức',
                category: 'ethnic',
                type: 'ethnic'
            },
            {
                name: 'Báo Tin Tức - Ảnh 360',
                url: 'https://baotintuc.vn/rss/anh-360.rss',
                source: 'Báo Tin Tức',
                category: 'photo360',
                type: 'photo360'
            }
        ];
    }

    async getAllFeeds() {
        const allNews = [];
        const errors = [];

        console.log(`🔄 Bắt đầu đọc ${this.rssSources.length} RSS feeds...`);

        // Process feeds in smaller batches to avoid overwhelming the server
        const batchSize = 5;
        for (let i = 0; i < this.rssSources.length; i += batchSize) {
            const batch = this.rssSources.slice(i, i + batchSize);
            const batchPromises = batch.map(async (rssConfig) => {
                const cacheKey = `${rssConfig.source}_${rssConfig.category}`;
                
                // Check cache first
                if (this.cache.has(cacheKey)) {
                    const cached = this.cache.get(cacheKey);
                    if (Date.now() - cached.timestamp < this.cacheTimeout) {
                        return cached.data;
                    }
                }

                try {
                    console.log(`📰 Đang đọc: ${rssConfig.name}`);
                    const feed = await this.parser.parseURL(rssConfig.url);
                    
                    const processedItems = feed.items.slice(0, 10).map(item => ({
                        title: this.cleanText(item.title || ''),
                        description: this.extractPlainText(item.contentSnippet || item.description || ''),
                        link: item.link || '',
                        pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
                        source: rssConfig.source,
                        category: rssConfig.category,
                        type: rssConfig.type,
                        image: this.extractImageUrl(item),
                        guid: item.guid || item.link || `${rssConfig.source}_${Date.now()}`,
                        tags: this.extractTags(item, rssConfig)
                    }));

                    // Cache the results
                    this.cache.set(cacheKey, {
                        data: processedItems,
                        timestamp: Date.now()
                    });

                    return processedItems;
                } catch (error) {
                    console.error(`❌ Lỗi khi đọc RSS ${rssConfig.name}:`, error.message);
                    errors.push({ source: rssConfig.name, error: error.message });
                    return [];
                }
            });

            const batchResults = await Promise.all(batchPromises);
            batchResults.forEach(items => {
                if (items.length > 0) {
                    allNews.push(...items);
                }
            });

            // Small delay between batches
            if (i + batchSize < this.rssSources.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        console.log(`✅ Hoàn thành đọc RSS: ${allNews.length} bài viết từ ${this.rssSources.length} nguồn`);
        if (errors.length > 0) {
            console.log(`⚠️ Có ${errors.length} lỗi trong quá trình đọc RSS`);
        }

        // Sort by publication date (newest first)
        return allNews.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    }

    // Get feeds from specific source
    async getFeedsBySource(sourceName, limit = 50) {
        const sourceFeeds = this.rssSources.filter(feed => 
            feed.source.toLowerCase() === sourceName.toLowerCase()
        );

        if (sourceFeeds.length === 0) {
            throw new Error(`Không tìm thấy nguồn RSS: ${sourceName}`);
        }

        const allNews = await this.getAllFeeds();
        return allNews
            .filter(item => item.source.toLowerCase() === sourceName.toLowerCase())
            .slice(0, limit);
    }

    // Get feeds by category
    async getFeedsByCategory(category, limit = 50) {
        const allNews = await this.getAllFeeds();
        return allNews
            .filter(item => item.category === category || item.type === category)
            .slice(0, limit);
    }

    // Get latest news (mixed from all sources)
    async getLatestNews(limit = 100) {
        const allNews = await this.getAllFeeds();
        return allNews.slice(0, limit);
    }

    // Get trending/popular news (based on multiple sources covering same story)
    async getTrendingNews(limit = 20) {
        const allNews = await this.getAllFeeds();
        const titleGroups = new Map();

        // Group similar titles
        allNews.forEach(item => {
            const normalizedTitle = this.normalizeTitle(item.title);
            if (!titleGroups.has(normalizedTitle)) {
                titleGroups.set(normalizedTitle, []);
            }
            titleGroups.get(normalizedTitle).push(item);
        });

        // Find stories covered by multiple sources
        const trending = Array.from(titleGroups.entries())
            .filter(([title, items]) => items.length > 1)
            .map(([title, items]) => ({
                title: items[0].title,
                description: items[0].description,
                link: items[0].link,
                pubDate: items[0].pubDate,
                sources: items.map(item => item.source),
                sourceCount: items.length,
                category: items[0].category,
                image: items[0].image,
                tags: Array.from(new Set(items.flatMap(item => item.tags)))
            }))
            .sort((a, b) => b.sourceCount - a.sourceCount)
            .slice(0, limit);

        return trending;
    }

    // Helper methods
    normalizeTitle(title) {
        return title
            .toLowerCase()
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 50);
    }

    extractImageUrl(item) {
        // Try multiple ways to extract image URL
        if (item['media:content'] && item['media:content']['$'] && item['media:content']['$'].url) {
            return item['media:content']['$'].url;
        }
        if (item['media:thumbnail'] && item['media:thumbnail']['$'] && item['media:thumbnail']['$'].url) {
            return item['media:thumbnail']['$'].url;
        }
        if (item.enclosure && item.enclosure.url) {
            return item.enclosure.url;
        }
        
        // Try to extract from content
        const content = item['content:encoded'] || item.content || item.description || '';
        const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (imgMatch) {
            return imgMatch[1];
        }

        return null;
    }

    extractTags(item, rssConfig) {
        const tags = [rssConfig.source, rssConfig.category];
        
        if (item.categories) {
            if (Array.isArray(item.categories)) {
                tags.push(...item.categories);
            } else {
                tags.push(item.categories);
            }
        }

        return Array.from(new Set(tags.filter(tag => {
            // Ensure tag is a string and not empty
            if (typeof tag === 'string') {
                return tag.trim().length > 0;
            } else if (tag && typeof tag === 'object' && tag.toString) {
                const tagStr = tag.toString().trim();
                return tagStr.length > 0;
            }
            return false;
        }).map(tag => {
            // Convert to string and trim
            return typeof tag === 'string' ? tag.trim() : String(tag).trim();
        })));
    }

    extractPlainText(html) {
        if (!html) return '';
        return html
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    // Clean text
    cleanText(text) {
        if (!text) return '';
        return text
            .replace(/\s+/g, ' ')
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .trim();
    }

    // Get all available sources
    getAllSources() {
        const sourceMap = new Map();
        
        this.rssSources.forEach(feed => {
            if (!sourceMap.has(feed.source)) {
                sourceMap.set(feed.source, {
                    name: feed.source,
                    categories: new Set(),
                    feedCount: 0
                });
            }
            
            const sourceInfo = sourceMap.get(feed.source);
            sourceInfo.categories.add(feed.category);
            sourceInfo.feedCount++;
        });

        return Array.from(sourceMap.values()).map(source => ({
            name: source.name,
            categories: Array.from(source.categories),
            feedCount: source.feedCount
        }));
    }

    // Search news
    async searchNews(query, limit = 50) {
        const allNews = await this.getAllFeeds();
        const queryLower = query.toLowerCase();
        
        return allNews
            .filter(item => 
                item.title.toLowerCase().includes(queryLower) ||
                item.description.toLowerCase().includes(queryLower) ||
                item.tags.some(tag => tag.toLowerCase().includes(queryLower))
            )
            .slice(0, limit);
    }

    // Get RSS statistics
    getStatistics() {
        const sources = this.getAllSources();
        const categoryCount = new Map();
        
        this.rssSources.forEach(feed => {
            categoryCount.set(feed.category, (categoryCount.get(feed.category) || 0) + 1);
        });
        
        return {
            totalSources: sources.length,
            totalFeeds: this.rssSources.length,
            categoriesCount: Object.fromEntries(categoryCount),
            cacheSize: this.cache.size,
            availableCategories: Array.from(categoryCount.keys())
        };
    }

    // Clear cache
    clearCache() {
        this.cache.clear();
        console.log('🗑️ RSS cache cleared');
    }
}

module.exports = RSSService;

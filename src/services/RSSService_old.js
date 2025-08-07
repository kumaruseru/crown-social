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
                category: 'general',
                feeds: {
                    latest: 'https://thanhnien.vn/rss/home.rss',
                    politics: 'https://thanhnien.vn/rss/thoi-su.rss',
                    world: 'https://thanhnien.vn/rss/the-gioi.rss',
                    business: 'https://thanhnien.vn/rss/tai-chinh-kinh-doanh.rss',
                    technology: 'https://thanhnien.vn/rss/cong-nghe.rss',
                    sports: 'https://thanhnien.vn/rss/the-thao.rss',
                    entertainment: 'https://thanhnien.vn/rss/giai-tri.rss',
                    health: 'https://thanhnien.vn/rss/suc-khoe.rss',
                    education: 'https://thanhnien.vn/rss/giao-duc.rss',
                    travel: 'https://thanhnien.vn/rss/du-lich.rss',
                    culture: 'https://thanhnien.vn/rss/van-hoa.rss'
                }
            },

            // Báo chuyên ngành - chỉ giữ lại nguồn hoạt động tốt
            // CafeF, VnEconomy bị lỗi 404 - đã xóa

            // Báo công nghệ
            // Genk bị lỗi 500 - đã xóa
            tinhte: {
                name: 'Tinhte',
                category: 'technology',
                feeds: {
                    latest: 'https://tinhte.vn/rss/',
                    mobile: 'https://tinhte.vn/forums/smartphone.rss',
                    laptop: 'https://tinhte.vn/forums/laptop.rss',
                    gaming: 'https://tinhte.vn/forums/gaming.rss'
                }
            },

            // Báo thể thao - Thể Thao 247 bị lỗi 404 - đã xóa

            // Báo y tế sức khỏe
            suckhoedoisong: {
                name: 'Sức Khỏe Đời Sống',
                category: 'health',
                feeds: {
                    latest: 'https://suckhoedoisong.vn/rss/trang-chu.rss',
                    health: 'https://suckhoedoisong.vn/rss/suc-khoe.rss',
                    medicine: 'https://suckhoedoisong.vn/rss/y-hoc-thuong-thuc.rss',
                    nutrition: 'https://suckhoedoisong.vn/rss/dinh-duong.rss'
                }
            }

            // VOV bị lỗi "Too many redirects" - đã xóa
            // VTC News bị lỗi parse XML - đã xóa  
            // Zing News bị lỗi DNS - đã xóa
            // Báo Lao Động bị lỗi "Feed not recognized" - đã xóa
            // Dân Trí, VietnamNet, Giáo Dục VN bị lỗi - đã xóa
        };
    }

    // Lấy tất cả RSS feeds từ một nguồn
    async getFeedsBySource(sourceName, categories = null) {
        const source = this.rssSources[sourceName];
        if (!source) {
            throw new Error(`Nguồn RSS "${sourceName}" không tồn tại`);
        }

        const feeds = source.feeds;
        const feedsToFetch = categories ? 
            Object.entries(feeds).filter(([category]) => categories.includes(category)) :
            Object.entries(feeds);

        const results = await Promise.allSettled(
            feedsToFetch.map(async ([category, url]) => {
                const cacheKey = `${sourceName}_${category}`;
                return await this.fetchFeedWithCache(cacheKey, url, source.name, category);
            })
        );

        return results
            .filter(result => result.status === 'fulfilled')
            .map(result => result.value)
            .flat();
    }

    // Lấy RSS feeds theo chủ đề từ tất cả nguồn
    async getFeedsByCategory(category, limit = 50) {
        const allFeeds = [];
        
        const fetchPromises = Object.entries(this.rssSources).map(async ([sourceName, source]) => {
            if (source.feeds[category]) {
                const cacheKey = `${sourceName}_${category}`;
                try {
                    const feeds = await this.fetchFeedWithCache(
                        cacheKey, 
                        source.feeds[category], 
                        source.name, 
                        category
                    );
                    return feeds;
                } catch (error) {
                    console.error(`Lỗi khi lấy feed từ ${sourceName}:`, error.message);
                    return [];
                }
            }
            return [];
        });

        const results = await Promise.allSettled(fetchPromises);
        
        results.forEach(result => {
            if (result.status === 'fulfilled') {
                allFeeds.push(...result.value);
            }
        });

        // Sắp xếp theo thời gian và giới hạn số lượng
        return allFeeds
            .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
            .slice(0, limit);
    }

    // Lấy tất cả tin tức mới nhất
    async getLatestNews(limit = 100) {
        return await this.getFeedsByCategory('latest', limit);
    }

    // Lấy tin theo chủ đề cụ thể
    async getPoliticsNews(limit = 50) {
        return await this.getFeedsByCategory('politics', limit);
    }

    async getBusinessNews(limit = 50) {
        return await this.getFeedsByCategory('business', limit);
    }

    async getTechnologyNews(limit = 50) {
        return await this.getFeedsByCategory('technology', limit);
    }

    async getSportsNews(limit = 50) {
        return await this.getFeedsByCategory('sports', limit);
    }

    async getHealthNews(limit = 50) {
        return await this.getFeedsByCategory('health', limit);
    }

    async getEducationNews(limit = 50) {
        return await this.getFeedsByCategory('education', limit);
    }

    async getEntertainmentNews(limit = 50) {
        return await this.getFeedsByCategory('entertainment', limit);
    }

    async getWorldNews(limit = 50) {
        return await this.getFeedsByCategory('world', limit);
    }

    async getTravelNews(limit = 50) {
        return await this.getFeedsByCategory('travel', limit);
    }

    // Fetch feed với cache
    async fetchFeedWithCache(cacheKey, url, sourceName, category) {
        const now = Date.now();
        const cached = this.cache.get(cacheKey);

        if (cached && (now - cached.timestamp) < this.cacheTimeout) {
            console.log(`📋 Sử dụng cache cho ${sourceName} - ${category}`);
            return cached.data;
        }

        try {
            console.log(`🔄 Đang tải RSS từ ${sourceName} - ${category}...`);
            const feed = await this.parser.parseURL(url);
            
            const processedItems = feed.items.map(item => ({
                id: item.guid || item.link || `${sourceName}_${Date.now()}_${Math.random()}`,
                title: this.cleanText(item.title),
                description: this.extractDescription(item),
                link: item.link,
                pubDate: item.pubDate,
                author: item.author || item.creator || sourceName,
                source: sourceName,
                category: category,
                image: this.extractImage(item),
                content: this.extractContent(item),
                tags: this.extractTags(item.title + ' ' + (item.description || '')),
                createdAt: new Date()
            }));

            // Cache kết quả
            this.cache.set(cacheKey, {
                data: processedItems,
                timestamp: now
            });

            console.log(`✅ Đã tải ${processedItems.length} bài từ ${sourceName} - ${category}`);
            return processedItems;

        } catch (error) {
            console.error(`❌ Lỗi khi tải RSS từ ${sourceName} - ${category}:`, error.message);
            return [];
        }
    }

    // Trích xuất mô tả
    extractDescription(item) {
        if (item['content:encoded']) {
            return this.cleanHTML(item['content:encoded']).substring(0, 500) + '...';
        }
        if (item.description) {
            return this.cleanHTML(item.description);
        }
        if (item.summary) {
            return this.cleanHTML(item.summary);
        }
        return '';
    }

    // Trích xuất nội dung đầy đủ
    extractContent(item) {
        if (item['content:encoded']) {
            return this.cleanHTML(item['content:encoded']);
        }
        return this.extractDescription(item);
    }

    // Trích xuất hình ảnh
    extractImage(item) {
        // Thử từ media:content
        if (item['media:content']) {
            if (Array.isArray(item['media:content'])) {
                const imageMedia = item['media:content'].find(media => 
                    media.$ && media.$.medium === 'image'
                );
                if (imageMedia && imageMedia.$.url) {
                    return imageMedia.$.url;
                }
            } else if (item['media:content'].$ && item['media:content'].$.url) {
                return item['media:content'].$.url;
            }
        }

        // Thử từ media:thumbnail
        if (item['media:thumbnail']) {
            if (Array.isArray(item['media:thumbnail'])) {
                return item['media:thumbnail'][0].$.url;
            } else if (item['media:thumbnail'].$ && item['media:thumbnail'].$.url) {
                return item['media:thumbnail'].$.url;
            }
        }

        // Thử tìm trong description/content
        const content = item.description || item['content:encoded'] || '';
        const imgMatch = content.match(/<img[^>]+src="([^">]+)"/i);
        if (imgMatch) {
            return imgMatch[1];
        }

        return null;
    }

    // Trích xuất tags từ title và description
    extractTags(text) {
        const commonWords = ['và', 'của', 'trong', 'với', 'cho', 'về', 'từ', 'tại', 'được', 'có', 'là', 'một', 'này', 'đã', 'sẽ', 'theo', 'như', 'để', 'sau', 'trước', 'khi', 'nếu'];
        
        return text
            .toLowerCase()
            .replace(/[^\w\sàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêềếểễệđìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 3 && !commonWords.includes(word))
            .slice(0, 10);
    }

    // Làm sạch HTML
    cleanHTML(html) {
        if (!html) return '';
        return html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    // Làm sạch text
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

    // Lấy danh sách tất cả nguồn RSS
    getAllSources() {
        return Object.entries(this.rssSources).map(([key, source]) => ({
            id: key,
            name: source.name,
            category: source.category,
            categories: Object.keys(source.feeds)
        }));
    }

    // Tìm kiếm tin tức
    async searchNews(query, limit = 50) {
        const allNews = await this.getLatestNews(200);
        const queryLower = query.toLowerCase();
        
        return allNews
            .filter(item => 
                item.title.toLowerCase().includes(queryLower) ||
                item.description.toLowerCase().includes(queryLower) ||
                item.tags.some(tag => tag.includes(queryLower))
            )
            .slice(0, limit);
    }

    // Thống kê RSS
    getStatistics() {
        const sources = this.getAllSources();
        const totalFeeds = sources.reduce((total, source) => total + source.categories.length, 0);
        
        return {
            totalSources: sources.length,
            totalFeeds: totalFeeds,
            categoriesCount: {
                general: sources.filter(s => s.category === 'general').length,
                business: sources.filter(s => s.category === 'business').length,
                technology: sources.filter(s => s.category === 'technology').length,
                sports: sources.filter(s => s.category === 'sports').length,
                health: sources.filter(s => s.category === 'health').length,
                education: sources.filter(s => s.category === 'education').length
            },
            cacheSize: this.cache.size
        };
    }

    // Xóa cache
    clearCache() {
        this.cache.clear();
        console.log('🗑️ Cache RSS đã được xóa');
    }
}

module.exports = RSSService;
